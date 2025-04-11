"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const OldPneuData = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nomClient, setNomClient] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([
    {
      field: 'F400FACDT',
      sort: 'desc',
    },
  ]);

  const API_URL = "http://localhost:3001/api/old_pneu_kms";

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiResponse = await axios.get(`${API_URL}?nom_client=${nomClient.trim() || ''}`);
      setData(apiResponse.data);
      setFilteredData(apiResponse.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Échec de la récupération des données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nomClient]);

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setError("La date de début doit être antérieure ou égale à la date de fin.");
        return;
      }

      const filtered = data.filter((row) => {
        const date = new Date(row.F400FACDT);
        return date >= start && date <= end;
      });

      setFilteredData(filtered);
    } catch {
      setError("Format de date invalide. Veuillez vérifier vos entrées.");
    }
  };

  useEffect(() => {
    applyDateFilter();
  }, [startDate, endDate, data]);

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
  };

  const handlePaginationModelChange = (newPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  // Fonction pour trier les données
  const getSortedData = (data) => {
    if (!sortModel.length) return data;

    const sorted = [...data].sort((a, b) => {
      const field = sortModel[0].field;
      const order = sortModel[0].sort === 'asc' ? 1 : -1;
      
      if (a[field] < b[field]) return -1 * order;
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });

    return sorted;
  };

  // Fonction pour paginer les données
  const getPaginatedData = (data) => {
    if (!data || data.length === 0) return [];
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return data.slice(start, end);
  };

  // Appliquer le tri et la pagination aux données filtrées
  const processedData = getPaginatedData(getSortedData(filteredData)).map((row, index) => ({
    id: row.F470CONTRAT || index,
    ...row
  }));

  // Calculate new statistics
  const totalDuration = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.F470DUREE || 0),
    0
  );
  const averageDuration =
    filteredData.length > 0 ? (totalDuration / filteredData.length).toFixed(2) : "N/A";

  const moyenneKMAffecte = filteredData.length > 0
    ? (
        filteredData.reduce(
          (sum, item) => sum + parseFloat(item.F470KMAFF || 0),
          0
        ) / filteredData.length
      ).toFixed(2)
    : "N/A";

  const averageDernierKM =
    filteredData.length > 0
      ? (
          filteredData.reduce(
            (sum, item) => sum + parseFloat(item.F090KM || 0),
            0
          ) / filteredData.length
        ).toFixed(2)
      : "N/A";

  const totalDotationPneu = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.F470NBPNEUS || 0),
    0
  );

  const totalConsomationPneu = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.PNEU_CONSOMME || 0),
    0
  );

  const averagePneuConsomme =
    filteredData.length > 0
      ? (
          filteredData.reduce(
            (sum, item) => sum + parseFloat(item.PNEU_CONSOMME || 0),
            0
          ) / filteredData.length
        ).toFixed(2)
      : "0";

  const columns = [
    { field: "F050NOM", headerName: "Client", width: 150 },
    { field: "F470CONTRAT", headerName: "Contrat", width: 80 },
    { field: "F090LIB", headerName: "Marque", width: 400 },
    { field: "F470DTDEP", headerName: "Date Départ", width: 150 },
    { field: "F470DTARRP", headerName: "Date Arrivée Prv", width: 150 },
    { field: "F470DTARR", headerName: "Date Arrivée Réelle", width: 150 },
    { field: "F470DUREE", headerName: "Durée", width: 50 },
    { field: "F470KMAFF", headerName: "KM Affecté", width: 90 },
    { field: "F090KM", headerName: "Dernier KM", width: 90 },
    { field: "F470NBPNEUS", headerName: "Dotation Pneu", width: 100 },
    { field: "PNEU_CONSOMME", headerName: "Consommation Pneu", width: 100 },
  ];

  return (
    <div className="px-4">
      <h2 className="mt-10 scroll-m-20 pb-2 text-3xl text-muted-foreground mb-4 font-semibold tracking-tight transition-colors first:mt-0">
        Pneus et Kilométrage
      </h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-blue-600 mb-2">Durée Moyenne</p>
              <div className="text-2xl font-bold text-blue-900 truncate">
                {averageDuration} jours
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-green-600 mb-2">Moyenne KM Affecté</p>
              <div className="text-2xl font-bold text-green-900 truncate">
                {moyenneKMAffecte} km
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-purple-600 mb-2">Moyenne Dernier KM</p>
              <div className="text-2xl font-bold text-purple-900 truncate">
                {averageDernierKM} km
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-600 mb-2">Total Dotation Pneu</p>
              <div className="text-2xl font-bold text-orange-900 truncate">
                {totalDotationPneu}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-red-600 mb-2">Total Consommation Pneu</p>
              <div className="text-2xl font-bold text-red-900 truncate">
                {totalConsomationPneu}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-yellow-600 mb-2">Consommation Moyenne Pneu</p>
              <div className="text-2xl font-bold text-yellow-900 truncate">
                {averagePneuConsomme}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-50 border border-red-200 rounded">
          Erreur: {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="w-64">
            <Label htmlFor="client-search" className="mb-2 block">
              Rechercher par client
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                placeholder="Nom du client..."
                value={nomClient}
                onChange={(e) => setNomClient(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-64">
            <Label htmlFor="date-start" className="mb-2 block">
              Date de début
            </Label>
            <Input
              id="date-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-64">
            <Label htmlFor="date-end" className="mb-2 block">
              Date de fin
            </Label>
            <Input
              id="date-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={fetchData} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Rechercher
        </Button>
      </div>

      {loading && <div className="loader2"></div>}
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredData.map((row, index) => ({
            id: row.F470CONTRAT || index,
            ...row
          }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          sortingMode="client"
          paginationMode="client"
          className="bg-white"
        />
      </div>
    </div>
  );
};

export default OldPneuData;

