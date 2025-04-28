"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown, Eye, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

const columns = [
  {
    field: "actions",
    headerName: "",
    flex: 0.2,
    renderCell: (params) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => params.row.onViewClick()}
        className="cursor-pointer"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
  { field: "client", headerName: "Client", flex: 1 },
  { field: "nombre_contrats", headerName: "Nombre de Contrats", flex: 1 },
];

export default function ContratParClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [clientSearch, setClientSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dateFin, setDateFin] = useState(() => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3); // Default to 3 months from now
    return today.toISOString().split("T")[0];
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (
    page,
    pageSize,
    sortField,
    sortOrder,
    filterItems
  ) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page + 1,
        pageSize: pageSize,
        dateDebut: dateDebut,
        dateFin: dateFin,
      });

      // Add sorting parameters if available
      if (sortField && sortOrder) {
        params.append("sortField", sortField);
        params.append("sortOrder", sortOrder);
      }

      // Add filter parameters if available
      if (filterItems && filterItems.length > 0) {
        params.append("filters", JSON.stringify(filterItems));
      }

      // Add client search if available
      if (clientSearch) {
        params.append("clientSearch", clientSearch);
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/contrats_par_client?${params.toString()}`
      );
      const data = await response.json();

      // Add onViewClick handler to each row
      const rowsWithActions = (data.items || []).map((row) => ({
        ...row,
        onViewClick: () => handleViewClick(row),
      }));

      setRows(rowsWithActions);
      setRowCount(data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (row) => {
    setSelectedClient(row);
    try {
      const params = new URLSearchParams({
        dateDebut: dateDebut,
        dateFin: dateFin,
      });

      const url = `${process.env.NEXT_PUBLIC_API_URL}/marche_public/${
        row.code_client
      }?${params.toString()}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      setClientDetails(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching client details:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  };

  useEffect(() => {
    // Get sorting parameters
    const sortField = sortModel.length > 0 ? sortModel[0].field : null;
    const sortOrder = sortModel.length > 0 ? sortModel[0].sort : null;

    fetchData(
      paginationModel.page,
      paginationModel.pageSize,
      sortField,
      sortOrder,
      filterModel.items
    );
  }, [
    paginationModel,
    sortModel,
    filterModel,
    clientSearch,
    dateDebut,
    dateFin,
  ]);

  // Handle client search with debounce
  const handleClientSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setClientSearch(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleExport = () => {
    setExportLoading(true);
    try {
      // Prepare data for export
      const exportData = clientDetails.map((detail) => ({
        Contrat: detail.CONTRAT,
        Durée: detail.DUREE,
        KM: detail.KM,
        "Marque Modèle": detail["marque modele"],
        Immatriculation: detail.IMMA,
        "Date Début": detail.Date_Debut,
        "Date Arrivée Prévue": detail.Date_arrive_prevue,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contrats");

      // Generate file name
      const fileName = `Contrats_${selectedClient?.client}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="p-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Contrats Public
      </h3>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="w-full sm:w-64">
          <Label htmlFor="client-search" className="mb-2 block">
            Rechercher par client
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="client-search"
              placeholder="Nom du client..."
              value={searchInput}
              onChange={handleClientSearch}
              className="pl-8"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="date-debut" className="mb-2 block">
            Date Début
          </Label>
          <Input
            id="date-debut"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="date-fin" className="mb-2 block">
            Date Fin
          </Label>
          <Input
            id="date-fin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {loading && <div className="loader2"></div>}
      {/* <div className="h-[50vh] overflow-auto"> */}
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={setPaginationModel}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        getRowId={(row) => row.code_client}
        disableRowSelectionOnClick
      />
      {/* </div> */}

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
                    Détails des Contrats - {selectedClient?.client}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className={"bg-primary"}
                      size="sm"
                      onClick={handleExport}
                      disabled={exportLoading}
                    >
                      {exportLoading ? (
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
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Contrat
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Durée
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          KM
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Marque Modèle
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Immatriculation
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date Début
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date Arrivée Prévue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientDetails.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.CONTRAT}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.DUREE}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.KM}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail["marque modele"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.IMMA}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.Date_Debut}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {detail.Date_arrive_prevue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
