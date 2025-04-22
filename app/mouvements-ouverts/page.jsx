'use client'

import { useEffect, useState } from "react"
import { Eye, Loader2, Search, FileDown } from "lucide-react"
import TableLoader from "@/components/Loaders/TableLoader"
import { DataGrid } from "@mui/x-data-grid"
import * as XLSX from "xlsx"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [detailsData, setDetailsData] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loadingIcon, setLoadingIcon] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [searchMarque, setSearchMarque] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/postion_car`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedPosition) {
        fetchDetailsData(selectedPosition);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchMarque, paginationModel, sortModel, filterModel]); // Add dependencies that should trigger a refetch

  const fetchDetailsData = async (code) => {
    setDetailsLoading(true);
    try {
      // Build sort parameter
      const sortParam = sortModel.length > 0 
        ? `${sortModel[0].field}:${sortModel[0].sort}` 
        : '';

      // Build filter parameter
      const filterParam = filterModel.items
        .filter(item => item.value && item.value.toString().trim() !== '')
        .map(item => `${item.field}:${item.operator}:${item.value}`)
        .join(',');

      const params = new URLSearchParams({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        code: code,
        search: searchMarque || '',
        sort: sortParam,
        filter: filterParam
      });

      const response = await fetch(`${API_URL}/get_all_positions?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setDetailsData(result.items || []);
      setRowCount(result.total || 0);
    } catch (error) {
      console.error("Error fetching details:", error);
      setDetailsData([]);
      setRowCount(0);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedPosition) return;
    
    setExporting(true);
    try {
      const params = new URLSearchParams({
        code: selectedPosition,
        page: 1,
        pageSize: rowCount
      });

      if (searchMarque) {
        params.append('search', searchMarque);
      }

      const response = await fetch(`${API_URL}/get_all_positions?${params}`);
      const data = await response.json();

      const ws = XLSX.utils.json_to_sheet(data.items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Positions");
      XLSX.writeFile(wb, `positions_${selectedPosition}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleEyeClick = async (code, index) => {
    setLoadingIcon(index);
    setSelectedPosition(code);
    setShowDialog(true);
    await fetchDetailsData(code);
    setLoadingIcon(null);
  };

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
  };

  const handleFilterModelChange = (newFilterModel) => {
    setFilterModel(newFilterModel);
  };

  const handlePaginationModelChange = (newPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  const columns = [
    {
      field: "Code_position",
      headerName: "Code Position",
      width: 150,
    },
    {
      field: "Date_depart",
      headerName: "Date Départ",
      width: 180,
    },
    {
      field: "Date_arrivee",
      headerName: "Date Arrivée",
      width: 180,
    },
    {
      field: "Km_depart",
      headerName: "Km Départ",
      width: 130,
      type: 'number',
    },
    {
      field: "Code_vehicule",
      headerName: "Statut",
      width: 150,
    },
    {
      field: "Marque",
      headerName: "Marque",
      width: 200,
    }
  ];

  const getRowId = (row) => {
    const vehicule = row.code_vehicule || row.Code_vehicule;
    const depart = row.date_depart || row.Date_depart;
    return `${vehicule}-${depart}`;
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-semibold text-muted-foreground mb-6">
        Les mouvements ouverts
      </h1>

      {loading ? (
        <TableLoader />
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center w-16">
                    Détails
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Nombre de Véhicules
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr 
                    key={`${item.code}-${index}`}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-center">
                      {loadingIcon === index ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-700" />
                      ) : (
                        <Eye 
                          className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors mx-auto" 
                          onClick={() => handleEyeClick(item.code, index)}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-center">
                      {item.position}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.Nombre_Vehicule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Détails de la Position</h2>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search and Export Controls */}
            <div className="flex justify-between items-center px-6 py-3 border-b flex-shrink-0">
              <div className="w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    placeholder="Rechercher par Marque..."
                    value={searchMarque}
                    onChange={(e) => setSearchMarque(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting || detailsData.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  (exporting || detailsData.length === 0) && 'opacity-50 cursor-not-allowed'
                }`}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {exporting ? "Exportation..." : "Exporter"}
              </button>
            </div>

            {/* DataGrid Container */}
            <div className="flex-1 overflow-hidden min-h-0">
              <div style={{ height: '100%', width: '100%' }}>
                <DataGrid
                  rows={detailsData}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationModelChange}
                  pageSizeOptions={[25, 50, 100]}
                  rowCount={rowCount}
                  paginationMode="server"
                  sortingMode="server"
                  filterMode="server"
                  loading={detailsLoading}
                  sortModel={sortModel}
                  onSortModelChange={handleSortModelChange}
                  filterModel={filterModel}
                  onFilterModelChange={handleFilterModelChange}
                  getRowId={(row) => `${row.Code_vehicule}-${row.Date_depart}`}
                  disableRowSelectionOnClick
                  className="bg-white"
                  sx={{
                    '& .MuiDataGrid-main': { flex: 1 },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid rgba(224, 224, 224, 1)',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      overflow: 'auto',
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
