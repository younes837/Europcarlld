"use client";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown, DollarSign, Car, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

const columns = [
  { field: "Marque", headerName: "Marque", width: 300 },
  {
    field: "Somme_de_PRIX_TTC",
    headerName: "Prix d'achat TTC",
    width: 150
,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
},
  },
  {
    field: "Somme_de_Prix_de_vente_TTC",
    headerName: "Prix de vente TTC",
    width: 150,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
},
  },
  {
    field: "Pourcentage",
    headerName: "Pourcentage (%)",
    width: 130,
  },
  {
    field: "Nombre_de_Matricule",
    headerName: "Nombre de Matricule",
    width: 180,
  },
  {
    field: "Moyenne_de_Duree_de_vie",
    headerName: "Moyenne de Durée de vie (Mois)",
    width: 220,
  },
  {
    field: "VR",
    headerName: "Moyenne de VR",
    width: 150,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
},
  },
];

export default function VRTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState("12");
  const [searchInput, setSearchInput] = useState("");
  const [filteredRows, setFilteredRows] = useState([]);

  const fetchData = async (months) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vr?months=${months}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Raw data from API:", data); // Debug log

      // Transform data to ensure all fields are properly typed as numbers
      const transformedData = data.map((item, index) => {
        console.log("Processing item:", item); // Debug log
        return {
          id: index,
          Marque: item.Marque,
          Somme_de_PRIX_TTC: Number(item.Somme_de_PRIX_TTC),
          Somme_de_Prix_de_vente_TTC: Number(item.Somme_de_Prix_de_vente_TTC),
          Pourcentage: Number(item.Pourcentage),
          Nombre_de_Matricule: Number(item.Nombre_de_Matricule),
          Moyenne_de_Duree_de_vie: Number(item.Moyenne_de_Duree_de_vie),
          VR: Number(item.VR),
        };
      });

      console.log("Transformed data:", transformedData); // Debug log
      setRows(transformedData);
      setFilteredRows(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonths);
  }, [selectedMonths]);

  useEffect(() => {
    if (searchInput.trim() === "") {
      setFilteredRows(rows);
    } else {
      const filtered = rows.filter((row) =>
        row.Marque.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredRows(filtered);
    }
  }, [searchInput, rows]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleMonthsChange = (e) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 120)) {
      setSelectedMonths(value);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      const formattedData = filteredRows.map((row) => ({
        Marque: row.Marque,
        "Prix d'achat TTC": row.Somme_de_PRIX_TTC,
        "Prix de vente TTC": row.Somme_de_Prix_de_vente_TTC,
        Pourcentage: row.Pourcentage,
        "Nombre de véhicules": row.Nombre_de_Matricule,
        "Durée de vie moyenne (mois)": row.Moyenne_de_Duree_de_vie,
        "Valeur de revente": row.VR,
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Données VR");

      XLSX.writeFile(
        wb,
        `valeurs_revente_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate totals from filtered rows
  const calculateTotals = (rows) => {
    return rows.reduce(
      (acc, row) => ({
        totalPrixAchat: acc.totalPrixAchat + (row.Somme_de_PRIX_TTC || 0),
        totalPrixVente:
          acc.totalPrixVente + (row.Somme_de_Prix_de_vente_TTC || 0),
        totalMatricules: acc.totalMatricules + (row.Nombre_de_Matricule || 0),
      }),
      {
        totalPrixAchat: 0,
        totalPrixVente: 0,
        totalMatricules: 0,
      }
    );
  };

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Les Valeurs de Residuelles des Véhicules
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Prix d'achat
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {calculateTotals(
                    filteredRows
                  ).totalPrixAchat.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  DH
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Prix de vente
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {calculateTotals(
                    filteredRows
                  ).totalPrixVente.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  DH
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Matricules
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Car className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {calculateTotals(
                    filteredRows
                  ).totalMatricules.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  véhicules
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Period Controls */}
      <div className="flex justify-between items-end gap-4 mb-4">
        <div className="flex gap-4 items-end flex-1">
          <div className="w-full sm:w-64">
            <Label htmlFor="marque-search" className="mb-2 block">
              Rechercher par marque
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="marque-search"
                placeholder="Nom de la marque..."
                value={searchInput}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-32">
            <Label htmlFor="period-input" className="mb-2 block">
              Période (mois)
            </Label>
            <Input
              id="period-input"
              type="number"
              min="1"
              max="120"
              value={selectedMonths}
              onChange={handleMonthsChange}
              className="w-full"
            />
          </div>
        </div>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2 text-black"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4 text-black" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      {loading && <div className="loader2"></div>}
      <div className="h-[75vh] overflow-y-auto">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
        />
      </div>
    </div>
  );
}
