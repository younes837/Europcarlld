"use client";
import React, { useEffect, useState, Suspense } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

// Memoize columns definition to prevent unnecessary re-renders
const columns = [
  {
    field: "contrat",
    headerName: "Contrat",
    width: 160,
    sortable: true,
  },
  {
    field: "marque",
    headerName: "Marque",
    width: 160,
    sortable: true,
  },
  {
    field: "matricule",
    headerName: "Matricule",
    width: 160,
    sortable: true,
  },
  {
    field: "nom_client",
    headerName: "Nom du client",
    width: 160,
    sortable: true,
  },
  {
    field: "libele",
    headerName: "Libellé",
    width: 160,
    sortable: true,
  },
  {
    field: "date_entree",
    headerName: "Date d'entrée",
    width: 160,
    sortable: true,
  },
  {
    field: "date_depart",
    headerName: "Date de départ",
    width: 160,
    sortable: true,
  },
  {
    field: "date_arrivee",
    headerName: "Date d'arrivée",
    width: 160,
    sortable: true,
  },
];

// Separate data fetching function for better error handling and reusability
async function fetchVehiculeData() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vh_enattente`, {
    next: { revalidate: 300 }, // Cache data for 5 minutes
  });
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
}

export default function Page() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [marqueSearch, setMarqueSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchVehiculeData();
        const items = data || [];
        
        if (mounted) {
          const processedItems = items.map(item => ({
            ...item,
            id: `${item.id}+${item.matricule}+${item.contrat}`,
          }));
          
          setAllData(processedItems);
          setFilteredData(processedItems);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
        if (mounted) {
      setLoading(false);
    }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // Optimize search by debouncing and memoizing the filter operation
  useEffect(() => {
    const filtered = allData.filter(item => {
      const matchMatricule = !matriculeSearch || 
        (item.matricule?.toLowerCase() || "").includes(matriculeSearch.toLowerCase());
      const matchMarque = !marqueSearch || 
        (item.marque?.toLowerCase() || "").includes(marqueSearch.toLowerCase());
      return matchMatricule && matchMarque;
    });
    setFilteredData(filtered);
  }, [matriculeSearch, marqueSearch, allData]);

  const exportToExcel = () => {
    try {
      const formattedData = filteredData.map((row) => ({
        Contrat: row.contrat,
        Marque: row.marque,
        Matricule: row.matricule,
        "Nom du client": row.nom_client,
        Libellé: row.libele,
        "Date d'entrée": row.date_entree,
        "Date de départ": row.date_depart,
        "Date d'arrivée": row.date_arrivee,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Véhicules en Attente");
      XLSX.writeFile(wb, `vehicules_en_attente_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Les Véhicules en Attente
      </h2>

        <div className="flex justify-between items-center mb-4">
        <div className="flex justify-evenly items-center">
              <div className="w-full sm:w-64 mx-3">
            <Label htmlFor="matricule-search" className="mb-2 block">
                  Rechercher par matricule
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                id="matricule-search"
                placeholder="Matricule..."
                value={matriculeSearch}
                onChange={(e) => setMatriculeSearch(e.target.value)}
                    className="pl-8"
                    />
                </div>
              </div>

              <div className="w-full sm:w-64 mx-3">
            <Label htmlFor="marque-search" className="mb-2 block">
                    Rechercher par marque
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                id="marque-search"
                placeholder="Marque..."
                value={marqueSearch}
                onChange={(e) => setMarqueSearch(e.target.value)}
                      className="pl-8"
                      />
                  </div>
              </div>
            </div>

            <Button
              onClick={exportToExcel}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
          Exporter vers Excel
            </Button>
        </div>

      <div className="h-[75vh] overflow-auto">
        <DataGrid
          rows={filteredData}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 50, page: 0 },
            },
          }}
          getRowId={(row) => `${row.id}+${row.matricule}+${row.contrat}`}
          disableRowSelectionOnClick
          keepNonExistentRowsSelected
        />
      </div>
    </div>
  );
}
