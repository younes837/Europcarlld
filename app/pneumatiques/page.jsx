"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown, Eye, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import frFR from "../frFR";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Users, Gauge, Box, DollarSign } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define columns for the details table
const detailsColumns = [
  { field: "F090KY", headerName: "Offre", width: 100 },
  { field: "F091IMMA", headerName: "Immatriculation", width: 120 },
  { field: "F050NOMPRE", headerName: "Client", width: 150 },
  { field: "F050NOM", headerName: "Fournisseur", width: 150 },
  // { field: "Code", headerName: "Code Client", width: 120 },
  { field: "F090LIB", headerName: "Marque", width: 150 },
  { field: "F410LIB", headerName: "Dimension", width: 150 },
  { field: "F410MTHT", headerName: "Montant HT", width: 120, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts}`}</span>
  );
}},
  // { field: "K410100PRO", headerName: "Code Produit", width: 120 },
  { field: "F400NMDOC", headerName: "N° Document", width: 120 },
  { field: "F410QT", headerName: "Quantité", width: 100, type: "number" },
  { field: "F410VISKM", headerName: "Kilométrage", width: 120, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}`}</span>
  );
}},
  { field: "F400FACDT", headerName: "Date Facture", width: 120 },
];

export default function PneumatiquesPage() {
  const [allData, setAllData] = useState([]); // Store all data
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // State for details modal
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState(null);

  // Calculate filtered data
  const filteredData = useMemo(() => {
    // Only include data rows, no totals row
    let filtered = allData.filter(row => row.id !== 'totals');
    
    if (clientSearch) {
      const searchLower = clientSearch.toLowerCase();
      filtered = filtered.filter(row => 
        row.CLIENT?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allData, clientSearch]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    return {
      number_of_vehicles: filteredData.reduce((sum, row) => sum + (Number(row.number_of_vehicles) || 0), 0),
      total_pneu_consommé: filteredData.reduce((sum, row) => sum + (Number(row.total_pneu_consommé) || 0), 0),
      total_pneu_dotation: filteredData.reduce((sum, row) => sum + (Number(row.total_pneu_dotation) || 0), 0),
      total_montant: filteredData.reduce((sum, row) => sum + (Number(row.total_montant) || 0), 0),
      client_count: filteredData.length,
      consommation_moyenne: filteredData.reduce((sum, row) => sum + (Number(row.number_of_vehicles) || 0), 0) > 0
        ? (filteredData.reduce((sum, row) => sum + (Number(row.total_pneu_consommé) || 0), 0) / 
           filteredData.reduce((sum, row) => sum + (Number(row.number_of_vehicles) || 0), 0)).toFixed(2)
        : 0
    };
  }, [filteredData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/total_pneu_client`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add totals row with a specific id
      const totalsRow = {
        id: 'totals',
        CLIENT: `Total Clients: ${data.totals.total_clients}`,
        number_of_vehicles: data.totals.total_vehicles,
        total_pneu_consommé: data.totals.total_pneus_consommes,
        total_pneu_dotation: data.totals.total_pneus_dotation,
        oldest_contract_date: '',
        consommation_moyenne: data.totals.total_vehicles > 0 
          ? (data.totals.total_pneus_consommes / data.totals.total_vehicles).toFixed(2) 
          : 0,
        total_montant: data.totals.total_montant,
      };

      // Add unique IDs to data items if they don't have them
      const itemsWithIds = data.items.map((item, index) => ({
        ...item,
        id: item.id || `row-${index}`
      }));

      // Set the data with totals row first
      setAllData([totalsRow, ...itemsWithIds]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = useCallback(
    (value) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setClientSearch(value);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  const exportToExcel = () => {
    try {
      setExportLoading(true);
      
      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      const formattedData = [
        {
          Client: `Total Clients: ${totals.client_count}`,
          "Nombre de Véhicules": totals.number_of_vehicles,
          "Total Pneus Consommés": totals.total_pneu_consommé,
          "Total Pneus Dotation": totals.total_pneu_dotation,
          "Date Contrat Plus Ancien": '',
          "Consommation Moyenne par Véhicule": totals.number_of_vehicles > 0 
            ? (totals.total_pneu_consommé / totals.number_of_vehicles).toFixed(2) 
            : 0,
          "Total Montant": totals.total_montant,
        },
        ...filteredData.map((row) => ({
          Client: row.CLIENT,
          "Nombre de Véhicules": row.number_of_vehicles,
          "Total Pneus Consommés": row.total_pneu_consommé,
          "Total Pneus Dotation": row.total_pneu_dotation,
          "Date Contrat Plus Ancien": row.oldest_contract_date,
          "Consommation Moyenne par Véhicule": row.consommation_moyenne,
          "Total Montant": row.total_montant,
        }))
      ];

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pneumatiques");

      XLSX.writeFile(
        wb,
        `pneumatiques_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Function to handle viewing details
  const handleViewDetails = async (row) => {
    setLoadingRowId(row.id || row.CLIENT);
    try {
      setDetailsLoading(true);
      
      // Debug log to see the row data
      console.log('Row data:', row);
      
      // Use the correct code field from the row
      const response = await fetch(`${API_URL}/detail_pneu_client?code=${row.code}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched details:', data); // Debug log to see the response data
      setClientDetails(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      setError(error.message);
    } finally {
      setDetailsLoading(false);
      setLoadingRowId(null);
    }
  };
  
  // Function to export details to Excel
  const exportDetailsToExcel = () => {
    try {
      if (clientDetails.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Transform the data to use the display headers
      const exportData = clientDetails.map(row => {
        const transformedRow = {};
        detailsColumns.forEach(column => {
          if (column.field && !column.field.startsWith('actions')) { // Skip action columns
            transformedRow[column.headerName] = row[column.field];
          }
        });
        return transformedRow;
      });
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Details");
      
      XLSX.writeFile(
        wb,
        `pneumatiques_details_${selectedClient?.CLIENT || 'unknown'}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting details to Excel:", error);
      setError(error.message);
    }
  };

  // Define columns for the main table
  const columns = [
    { 
      field: "actions", 
      headerName: "Action ", 
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        // Don't render action button for totals row
        if (params.row.CLIENT?.startsWith('Total Client')) return null;
        
        const isLoading = loadingRowId === (params.row.id || params.row.CLIENT);
        return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleViewDetails(params.row)}
          className="h-8 w-8 p-0"
            disabled={isLoading}
        >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-800 border-t-transparent"></div>
            ) : (
          <Eye className="h-4 w-4" />
            )}
        </Button>
        );
      },
    },
    { field: "CLIENT", headerName: "Client", width: 200 },
    { field: "number_of_vehicles", headerName: "Nombre de Véhicules", width: 160, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}`}</span>
  );
}},
    { field: "total_pneu_consommé", headerName: "Total Pneus Consommés", width: 180, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}`}</span>
  );
}},
    { field: "total_pneu_dotation", headerName: "Total Pneus Dotation", width: 180, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}`}</span>
  );
}},
    { field: "oldest_contract_date", headerName: "Date Contrat Plus Ancien", width: 180 },
    { field: "consommation_moyenne", headerName: "Consommation Moyenne par Véhicule", width: 220, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}},
    { field: "total_montant", headerName: "Total Montant", width: 150, type: "number" ,renderCell: (params) => {
  const value = parseFloat(params.value);
  if (isNaN(value)) return "000";

  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span className="font-bold"> {`${integerPart}.${parts[1]}`}</span>
  );
}},
  ];

  return (
    <div className="px-4">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
          Pneumatiques Consommés
        </h2>
        <Button
          onClick={exportToExcel}
          className="flex items-center gap-2 text-black"
          disabled={exportLoading}
        >
          <FileDown className="h-4 w-4" />
          {exportLoading ? "Exportation..." : "Exporter vers Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card className="bg-[#fafafa] border-0 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Total Clients
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {totals.client_count.toLocaleString("fr-FR")}
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
                  Nombre de Véhicules
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Car className="h-7 w-7 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {totals.number_of_vehicles.toLocaleString("fr-FR")}
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
                  Total Pneus Consommés
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Box className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {totals.total_pneu_consommé.toLocaleString("fr-FR")}
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
                  Total Pneus Dotation
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Box className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {totals.total_pneu_dotation.toLocaleString("fr-FR")}
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
                  Consommation Moyenne
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Gauge className="h-7 w-7 text-orange-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {Number(totals.consommation_moyenne).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  Montant Total
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <div className="text-2xl font-bold tracking-tight">
                  {totals.total_montant.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  DH
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col">
          <Label htmlFor="client-search" className="mb-2">
            Rechercher par Client
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="client-search"
              placeholder="Nom du client..."
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {loading && <div className="loader2"></div>}
      <div 
        className="flex-1 w-full" 
        style={{ 
          height: '60vh',
          minHeight: '400px'
        }}
      >
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
          getRowId={(row) => row.id || row.CLIENT}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          className="bg-white"
          sx={{ 
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-root': {
              border: 'none'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0'
            }
          }}
        />
      </div>

      {/* Full-screen Modal */}
      <div className={`fixed inset-0 z-50 ${isModalOpen ? "block" : "hidden"}`}>
        <div
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsModalOpen(false)}
        ></div>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-[95vw]">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-2xl font-semibold leading-6 text-gray-900">
                    Détails des Pneumatiques - {clientDetails[0]?.F050NOMPRE}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="bg-primary"
                      size="sm"
                      onClick={exportDetailsToExcel}
                      disabled={detailsLoading}
                    >
                      {detailsLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Exporter
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  {detailsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="loader2"></div>
                    </div>
                  ) : (
                    <div style={{ height: '60vh', width: '100%' }}>
                      <DataGrid
                        rows={clientDetails}
                        columns={detailsColumns}
                        loading={detailsLoading}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                          pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        pagination
                        getRowId={(row) => `${row.F090KY}_${row.F091IMMA}_${row.F400NMDOC}`}
                        className="bg-white"
                        disableRowSelectionOnClick
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

