"use client";

import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ExcelJS from "exceljs";

export default function ModelesUtilises() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use a fallback for the API URL
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/modele_plus_utilise`);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        // Transform data to match DataGrid requirements (with unique id)
        const formattedData = result.map((item, index) => ({
          id: index,
          modele: item["marque modele"] || "Non disponible",
          total: item.total || 0,
        }));
        setData(formattedData);
        setFilteredData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        item.modele.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  // Define columns for DataGrid
  const columns = [
    { field: "modele", headerName: "Marque/Modele", flex: 1 },
    { field: "total", headerName: "Total", width: 120, align: "right" },
  ];
  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Modeles Plus Utilises");

      // Add headers
      worksheet.columns = [
        { header: "Marque/Modele", key: "modele", width: 30 },
        { header: "Total", key: "total", width: 15 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      filteredData.forEach((item) => {
        worksheet.addRow({
          modele: item.modele,
          total: item.total,
        });
      });

      // Format the total column as numbers
      worksheet.getColumn("total").numFmt = "#,##0";

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modeles_plus_utilises.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="px-4">
      <h1 className="text-2xl font-bold mb-4">Modele Plus Utilise</h1>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="col-span-12 md:col-span-6 lg:col-span-4 space-y-2">
          <Label htmlFor="search-modele" className="text-sm font-medium">
            Rechercher Modele
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              id="search-modele"
              type="text"
              placeholder="Saisir le nom du modele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
        <div className="ml-auto mt-4">
          <button
            onClick={handleExportToExcel}
            disabled={loading || exportLoading}
            className="flex items-center justify-center h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={16} className="mr-2" />
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      <Box sx={{ height: "80vh", width: "100%" }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          density="standard"
          sx={{
            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
            "& .MuiDataGrid-cell:hover": { color: "primary.main" },
          }}
          loading={loading}
        />
      </Box>
    </div>
  );
}