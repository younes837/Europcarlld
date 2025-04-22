"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Calendar, X, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export default function LldVrPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [inputValue, setInputValue] = useState(""); // Immediate input value
  const [searchTerm, setSearchTerm] = useState(""); // Debounced search term
  const [exportLoading, setExportLoading] = useState(false);

  // Date filters with debounce - initialize both states with the same values
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("");
  const [debouncedStartDate, setDebouncedStartDate] = useState("2024-01-01"); // Initialize with same value
  const [debouncedEndDate, setDebouncedEndDate] = useState("");

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [sortModel, setSortModel] = useState([
    { field: "Date_Debut", sort: "desc" },
  ]);

  // Handle input change immediately
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setSearchTerm(inputValue);
        // Reset to first page when search changes
        setPaginationModel({
          ...paginationModel,
          page: 0,
        });
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timerId);
  }, [inputValue, searchTerm, paginationModel]);

  // Handle date changes
  const handleStartDateChange = (e) => {
    const value = e.target.value;
    console.log("Start date changed to:", value);
    setStartDate(value);
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    console.log("End date changed to:", value);
    setEndDate(value);
  };

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Debounce date filters
  useEffect(() => {
    console.log("Date change detected - current values:", {
      startDate,
      endDate,
    });
    const timerId = setTimeout(() => {
      console.log("Debouncing date values:", { startDate, endDate });
      if (startDate !== debouncedStartDate || endDate !== debouncedEndDate) {
        console.log("Updating debounced date values and resetting pagination");
        setDebouncedStartDate(startDate);
        setDebouncedEndDate(endDate);
        // Reset to first page when date filter changes
        setPaginationModel({
          ...paginationModel,
          page: 0,
        });
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timerId);
  }, [
    startDate,
    endDate,
    debouncedStartDate,
    debouncedEndDate,
    paginationModel,
  ]);

  // Export to Excel function - create an exact replica of the screenshot with ExcelJS
  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);

      // Get the sort field and direction
      const sortField =
        sortModel.length > 0 ? sortModel[0].field : "Date_Debut";
      const sortDirection = sortModel.length > 0 ? sortModel[0].sort : "desc";

      // Create a separate API call that won't trigger component state updates
      const fetchExportData = async () => {
        // Use the same endpoint but with a very large page size to get all data
        const apiUrl = `${
          process.env.NEXT_PUBLIC_API_URL
        }/lld_vr?page=0&pageSize=10000&sortField=${sortField}&sortDirection=${sortDirection}&searchQuery=${encodeURIComponent(
          searchTerm
        )}&fromDate=${debouncedStartDate}&toDate=${debouncedEndDate}`;

        console.log("Exporting data from:", apiUrl);

        const exportResponse = await fetch(apiUrl);

        if (!exportResponse.ok) {
          throw new Error("Failed to fetch data for export");
        }

        return await exportResponse.json();
      };

      // Get export data without affecting component state
      const exportData = await fetchExportData();

      console.log(
        `Received ${exportData.rows?.length || 0} rows for export out of ${
          exportData.totalCount
        }`
      );

      if (exportData.rows && exportData.rows.length > 0) {
        // Create the Excel file with exact styling including colored rows
        await createExactReplicaExcelJS(exportData.rows);
      } else {
        alert("Aucune donnée à exporter");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Erreur lors de l'exportation des données");
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to create an Excel file that exactly matches the screenshot with ExcelJS
  const createExactReplicaExcelJS = async (data) => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("LLD");

      // Set the column headers and widths exactly as shown in the screenshot
      worksheet.columns = [
        { header: "", width: 3 }, // Row number column
        { header: "client", width: 50 },
        { header: "CONTRAT", width: 12 },
        { header: "ETL", width: 8 },
        { header: "DUR", width: 8 },
        { header: "KM", width: 12 },
        { header: "loyer ht", width: 12 },
        { header: "loyer ttc", width: 12 },
        { header: "loyer glb", width: 15 },
        { header: "marque modele", width: 40 },
        { header: "IMMA", width: 15 },
        { header: "VR HT", width: 15 },
        { header: "VR TTC", width: 15 },
        { header: "ACH_PX_HT", width: 15 },
        { header: "ACH_PX_TTC", width: 15 },
        { header: "%", width: 8 },
        { header: "DT DEP", width: 15 },
        { header: "DT ARR PREV", width: 15 },
        { header: "DT ARR", width: 15 },
        { header: "PRIX VENTE", width: 15 },
        { header: "± Value", width: 15 },
      ];

      // Get the column count for merging
      const columnCount = worksheet.columns.length;

      // Clear any auto-generated headers
      worksheet.spliceRows(1, 1);

      // Row 1: Title row with green background
      const titleRow = worksheet.addRow([""]);

      // Merge cells for the title row
      worksheet.mergeCells(1, 1, 1, columnCount);

      // Add the title cell
      const titleCell = worksheet.getCell(1, 1);

      // Get current month and year in French and uppercase
      const monthYear = new Date()
        .toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })
        .toUpperCase();

      titleCell.value = `PARC MARLOC LLD ${monthYear}`;

      // Style the title cell - exact green from screenshot
      titleCell.font = {
        size: 14,
        bold: true,
        color: { argb: "000000" }, // Black text
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "92D050" }, // Exact green from screenshot
      };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Adjust row height for title
      worksheet.getRow(1).height = 30;

      // Row 2: Empty row
      worksheet.addRow([]);

      // Row 3: Header row
      const headerValues = [
        "",
        "client",
        "CONTRAT",
        "ETL",
        "DUR",
        "KM",
        "loyer ht",
        "loyer ttc",
        "loyer glb",
        "marque modele",
        "IMMA",
        "VR HT",
        "VR TTC",
        "ACH_PX_HT",
        "ACH_PX_TTC",
        "%",
        "DT DEP",
        "DT ARR PREV",
        "DT ARR",
        "PRIX VENTE",
        "± Value",
      ];

      const headerRow = worksheet.addRow(headerValues);

      // Apply bold formatting to header text
      headerRow.font = {
        bold: true,
        size: 10,
      };

      // Define custom colors for specific columns as requested
      // Column index map (1-based):
      // 6: loyer ht - yellow
      // 11: IMMA - beige
      // 13: VR TTC - green
      // 15: ACH_PX_TTC - light blue
      // 16: % - light pink

      // Apply fill color to header cells
      for (let i = 1; i <= columnCount; i++) {
        const cell = headerRow.getCell(i);

        // Apply different colors based on column with more intense colors
        if (i === 7) {
          // loyer ht
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFCC00" }, // Stronger yellow
          };
        } else if (i === 11) {
          // IMMA
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "D7B29E" }, // Stronger beige
          };
        } else if (i === 13) {
          // VR TTC
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "70AD47" }, // Stronger green
          };
        } else if (i === 15) {
          // ACH_PX_TTC
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "5B9BD5" }, // Stronger blue
          };
        } else if (i === 16) {
          // %
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "ED7D31" }, // Stronger orange/pink
          };
        } else {
          // Default header color - medium gray for better visibility
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "BDC3D6" }, // Medium blue/gray
          };
        }

        // Add borders to header cells
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Center align headers
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      }

      // Add data rows with alternating colors
      data.forEach((row, index) => {
        const rowNumber = index + 1;

        const values = [
          rowNumber, // Row number
          row.client,
          row.CONTRAT,
          row.ETAT,
          row.DUREE,
          row.KM,
          row["loyer ht"],
          row["loyer ttc"],
          row.loyer_global,
          row["marque modele"],
          row.IMMA,
          row["VR HT"],
          row["VR TTC"],
          row.ACH_PX_HT,
          row.ACH_PX_TTC,
          row["%"],
          row.Date_Debut,
          row.date_fin,
          row.fin_reelle,
          row.prix_vente,
          row.sessio,
        ];

        // Add the row to the worksheet (starts at row 4 after title, blank row, and header)
        const excelRow = worksheet.addRow(values);

        // Apply alternating row colors
        if (rowNumber % 2 === 0) {
          // Even rows - very light gray
          for (let i = 1; i <= columnCount; i++) {
            const cell = excelRow.getCell(i);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F2F2F2" }, // Exact light gray from screenshot
            };
          }
        }

        // Add borders to all cells in the row
        for (let i = 1; i <= columnCount; i++) {
          const cell = excelRow.getCell(i);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Format numbers (including the new DIFF column)
          if ([5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 20, 21].includes(i)) {
            cell.numFmt = "# ##0.00";
            cell.alignment = {
              horizontal: "center",
              vertical: "middle",
            };
          }

          // Format dates
          if ([17, 18, 19].includes(i)) {
            if (cell.value) {
              // Convert to proper date if it's not already
              if (!(cell.value instanceof Date)) {
                cell.value = new Date(cell.value);
              }
              cell.numFmt = "dd/mm/yyyy";
            }
          }

          // Apply more intense colors to data cells
          if (i === 7) {
            // loyer ht
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2CC" }, // Stronger light yellow
            };
            cell.font = { bold: true };
          } else if (i === 11) {
            // IMMA
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E4D5C3" }, // Stronger light beige
            };
            cell.font = { bold: true };
          } else if (i === 13) {
            // VR TTC
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "C5E0B4" }, // Stronger light green
            };
            cell.font = { bold: true };
          } else if (i === 15) {
            // ACH_PX_TTC
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "BDD7EE" }, // Stronger light blue
            };
            cell.font = { bold: true };
          } else if (i === 16) {
            // %
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8CBAD" }, // Stronger light pink/orange
            };
            cell.font = { bold: true };
          }
        }
      });

      // Auto-filter for the header row (now row 3)
      worksheet.autoFilter = {
        from: {
          row: 3,
          column: 1,
        },
        to: {
          row: 3,
          column: columnCount,
        },
      };

      // Generate filename
      const filename = `PARC_MARLOC_LLD_${monthYear.replace(" ", "_")}.xlsx`;

      // Write file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      // const a = document.createElement("a");
      // a.href = url;
      // a.download = filename;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);

      // // // Clean up
      // window.URL.revokeObjectURL(url);

      console.log(
        `Exported ${data.length} rows to ${filename} with custom color styling`
      );
      return true;
    } catch (error) {
      console.error("Error creating Excel file:", error);
      return false;
    }
  };

  // Fetch data with server-side pagination, sorting, and filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get the sort field and direction
        const sortField =
          sortModel.length > 0 ? sortModel[0].field : "Date_Debut";
        const sortDirection = sortModel.length > 0 ? sortModel[0].sort : "desc";

        // Build the API URL with all parameters
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/lld_vr?page=${
          paginationModel.page
        }&pageSize=${
          paginationModel.pageSize
        }&sortField=${sortField}&sortDirection=${sortDirection}&searchQuery=${encodeURIComponent(
          searchTerm
        )}&fromDate=${debouncedStartDate}&toDate=${debouncedEndDate}`;

        console.log("Fetching data from:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log("API response:", data);

        if (data.rows && typeof data.totalCount !== "undefined") {
          // Add id to each row for DataGrid
          const rowsWithIds = data.rows.map((row, index) => ({
            id: row.id || row.RowNum || index,
            ...row,
          }));

          setRows(rowsWithIds);
          setRowCount(data.totalCount);
        } else if (Array.isArray(data)) {
          const rowsWithIds = data.map((row, index) => ({
            id: index,
            ...row,
          }));

          setRows(rowsWithIds);
          setRowCount(rowsWithIds.length);
        } else {
          console.error("Unexpected data format:", data);
          setRows([]);
          setRowCount(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setRows([]);
        setRowCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    paginationModel,
    sortModel,
    searchTerm,
    debouncedStartDate,
    debouncedEndDate,
  ]);

  const columns = [
    { field: "client", headerName: "Client", width: 280 },
    { field: "CONTRAT", headerName: "Contrat", width: 120 },
    { field: "ETAT", headerName: "État", width: 80 },
    { field: "DUREE", headerName: "Durée", width: 60, type: "number" },
    {
      field: "KM",
      headerName: "KM",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "loyer ht",
      headerName: "Loyer HT",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "loyer ttc",
      headerName: "Loyer TTC",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "loyer_global",
      headerName: "Loyer Global",
      width: 120,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    { field: "marque modele", headerName: "Marque/Modèle", width: 270 },
    { field: "IMMA", headerName: "Immatriculation", width: 120 },
    {
      field: "VR HT",
      headerName: "VR HT",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "VR TTC",
      headerName: "VR TTC",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params)) return "000";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "ACH_PX_HT",
      headerName: "Prix Achat HT",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params) || params === null) return "-";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "ACH_PX_TTC",
      headerName: "Prix Achat TTC",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params) || params === null) return "-";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    { field: "%", headerName: "%", width: 80, type: "number" },
    { field: "Date_Debut", headerName: "Date Début", width: 150 },
    { field: "date_fin", headerName: "Date Fin", width: 150 },
    { field: "fin_reelle", headerName: "Fin Réelle", width: 150 },
    {
      field: "prix_vente",
      headerName: "Prix de Vente",
      width: 100,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params) || params === null) return "-";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
    {
      field: "sessio",
      headerName: "± Value",
      width: 120,
      type: "number",
      valueFormatter: (params) => {
        if (isNaN(params) || params === null) return "-";

        const parts = params.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${integerPart}.${parts[1]}`;
      },
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LLD - VR</h1>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Client search input with label */}
        <div className="relative flex flex-col w-72">
          <label htmlFor="client-search" className="text-xs text-gray-500 mb-1">
            Rechercher un client
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <Search size={16} />
            </div>
            <Input
              id="client-search"
              type="text"
              placeholder="Entrez un nom..."
              value={inputValue}
              onChange={handleInputChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date range inputs */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="text-xs text-gray-500 mb-1">
              Date début
            </label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-40"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="end-date" className="text-xs text-gray-500 mb-1">
              Date fin
            </label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-40"
            />
          </div>

          {/* Reset date filter button - styled */}
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilters}
              className="flex items-center justify-center h-9 px-3 mt-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
            >
              <X size={16} className="mr-1" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Export to Excel button */}
        <div className="ml-auto">
          <button
            onClick={handleExportToExcel}
            disabled={loading || exportLoading}
            className="flex items-center justify-center h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={16} className="mr-2" />
            {exportLoading ? "Exportation..." : `Exporter (${rowCount})`}
          </button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <DataGrid
          rows={rows}
          rowCount={rowCount}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <div className="flex items-center justify-center h-full p-4 text-gray-500">
                {searchTerm || debouncedStartDate || debouncedEndDate
                  ? "Aucun résultat trouvé pour ces critères de recherche"
                  : "Aucune donnée disponible"}
              </div>
            ),
          }}
          getRowHeight={() => "auto"}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              whiteSpace: "normal",
              lineHeight: "normal",
              padding: "8px",
            },
          }}
        />
      </div>
    </div>
  );
}
