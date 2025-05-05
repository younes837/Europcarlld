"use client";
import { useState, useEffect } from "react";
import { Eye, FileDown, ArrowUpDown, X, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import Loading from "../loading";

const TableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[150px]">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        </TableHead>
        <TableHead>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(10)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ContractDetailsDialog = ({
  isOpen,
  onClose,
  clientCode,
  isPublic,
  months,
}) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchImma, setSearchImma] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!isOpen || !clientCode) return;

      try {
        const route = isPublic
          ? "contrats_public_details"
          : "contrats_prive_details";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${route}/${clientCode}?months=${months}`
        );
        const data = await response.json();

        if (isMounted) {
          setDetails(data.result);
          setClientName(data.client_name);
          setLoading(false);
          setInitialLoading(false);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        if (isMounted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    };

    if (isOpen) {
      setInitialLoading(true);
      setLoading(true);
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, clientCode, isPublic, months]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setInitialLoading(true);
      setSearchImma("");
      setSortConfig({ key: null, direction: "asc" });
      setCurrentPage(1);
      setDetails([]);
      setClientName("");
    }
  }, [isOpen]);

  const handleExport = (type) => {
    setExportLoading(true);
    const ws = XLSX.utils.json_to_sheet(filteredAndSortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    XLSX.writeFile(
      wb,
      `contrats_details_${clientName}_${type}_${months}mois.xlsx`
    );
    setExportLoading(false);
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date fields
      if (sortConfig.key.includes("Date")) {
        return sortConfig.direction === "asc"
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }

      // Handle numeric fields
      if (["DUREE", "KM"].includes(sortConfig.key)) {
        return sortConfig.direction === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      // Handle string fields
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filterByImma = (data) => {
    if (!searchImma) return data;
    return data.filter((item) =>
      item.IMMA.toLowerCase().includes(searchImma.toLowerCase())
    );
  };

  const requestSort = (key) => {
    setSortConfig((prevSort) => ({
      key,
      direction:
        prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortDirection = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction;
    }
    return null;
  };

  const filteredAndSortedData = sortData(filterByImma(details));
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortableTableHead = ({ children, sortKey, className }) => {
    const direction = getSortDirection(sortKey);

    return (
      <TableHead
        className={`sticky top-0 bg-background group ${className}`}
        onClick={() => requestSort(sortKey)}
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
          <ArrowUpDown
            className={`h-4 w-4 transition-opacity ${
              direction ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } ${direction === "desc" ? "rotate-180" : ""}`}
          />
        </div>
      </TableHead>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90%] max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Détails des Contrats</h2>
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  isPublic ? "bg-green-200" : "bg-orange-200"
                }`}
              >
                {isPublic ? "Public" : "Privé"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="search-imma">
                Rechercher par Immatriculation
              </Label>
              <Input
                id="search-imma"
                value={searchImma}
                onChange={(e) => setSearchImma(e.target.value)}
                placeholder="Rechercher..."
                className="w-64"
              />
            </div>
          </div>
          <Button
            onClick={() => handleExport(isPublic ? "public" : "prive")}
            className="bg-green-500 hover:bg-green-600 text-white hover:text-white"
            disabled={exportLoading}
          >
            <FileDown className="h-4 w-4 text-white" />
            {exportLoading ? "Exportation..." : "Exporter vers Excel"}
          </Button>
        </div>

        <div className="flex-1 overflow-auto min-h-0 p-4">
          {initialLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="CONTRAT">
                      N° Contrat
                    </SortableTableHead>
                    <SortableTableHead sortKey="DUREE">
                      Durée (mois)
                    </SortableTableHead>
                    <SortableTableHead sortKey="KM">
                      Kilométrage
                    </SortableTableHead>
                    <SortableTableHead sortKey="marque modele">
                      Marque Modèle
                    </SortableTableHead>
                    <SortableTableHead sortKey="IMMA">
                      Immatriculation
                    </SortableTableHead>
                    <SortableTableHead sortKey="Date_Debut">
                      Date Début
                    </SortableTableHead>
                    <SortableTableHead sortKey="Date_arrive_prevue">
                      Date Fin Prévue
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Aucun résultat trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row) => (
                      <TableRow key={row.CONTRAT}>
                        <TableCell>{row.CONTRAT}</TableCell>
                        <TableCell>{row.DUREE}</TableCell>
                        <TableCell>{row.KM.toLocaleString()}</TableCell>
                        <TableCell>{row["marque modele"]}</TableCell>
                        <TableCell>{row.IMMA}</TableCell>
                        <TableCell>
                          {new Date(row.Date_Debut).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            row.Date_arrive_prevue
                          ).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        <div className="border-t p-2 bg-background">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedData.length} résultats
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RestitutionsContrats() {
  const [publicContracts, setPublicContracts] = useState([]);
  const [privateContracts, setPrivateContracts] = useState([]);
  const [months, setMonths] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isPublicSelected, setIsPublicSelected] = useState(true);
  const [totalContrats, setTotalContrats] = useState({ public: 0, private: 0 });

  const fetchData = async () => {
    setInitialLoading(false);
    setLoading(true);
    try {
      const [publicRes, privateRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contrats_public_arrive?months=${months}`
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contrats_prive_arrive?months=${months}`
        ),
      ]);

      // Check if responses are ok
      if (!publicRes.ok || !privateRes.ok) {
        console.error("Public Response Status:", publicRes.status);
        console.error("Private Response Status:", privateRes.status);

        // Log the actual response text for debugging
        const publicText = await publicRes.text();
        const privateText = await privateRes.text();
        console.error("Public Response Text:", publicText);
        console.error("Private Response Text:", privateText);

        throw new Error("One or more API calls failed");
      }

      // Try to parse the JSON responses
      let publicData, privateData;
      try {
        publicData = await publicRes.json();
        privateData = await privateRes.json();
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Failed to parse API response as JSON");
      }

      // Validate the data structure
      if (!Array.isArray(publicData) || !Array.isArray(privateData)) {
        console.error("Invalid data structure received");
        console.error("Public Data Type:", typeof publicData);
        console.error("Private Data Type:", typeof privateData);
        throw new Error("Invalid data structure received from API");
      }

      setPublicContracts(publicData);
      setPrivateContracts(privateData);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Reset the data in case of error
      setPublicContracts([]);
      setPrivateContracts([]);
    } finally {
      setLoading(false);
      totalContratsPrivePublic();
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  const filterData = (data) => {
    if (!searchQuery) return data;
    return data.filter(
      (row) =>
        row.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.code_client.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalContratsPrivePublic = () => {
    setTotalContrats({ public: 0, private: 0 });
    privateContracts.map((item) =>
      setTotalContrats({
        ...totalContrats,
        private: totalContrats.private + item.nombre_contrats,
      })
    );
    publicContracts.map((item) =>
      setTotalContrats({
        ...totalContrats,
        public: totalContrats.public + item.nombre_contrats,
      })
    );
  };

  const exportToExcel = (data, fileName) => {
    setExportLoading(true);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contracts");
    XLSX.writeFile(wb, `${fileName}_${months}mois.xlsx`);
    setExportLoading(false);
  };

  const handleViewDetails = (row, isPublic) => {
    setSelectedClient(row.code_client);
    setIsPublicSelected(isPublic);
    setDialogOpen(true);
  };

  const ContractsTable = ({ data, title, onExport, isPublic }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContrats, setTotalContrats] = useState(0);
    const [sortConfig, setSortConfig] = useState({
      key: null,
      direction: "asc",
    });
    const itemsPerPage = 10;
    useEffect(() => {
      totalContratsPrivePublic();
    }, [data]);

    const sortData = (data) => {
      if (!sortConfig.key) return data;

      return [...data].sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert to lowercase if string
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    };

    const requestSort = (key) => {
      setSortConfig((prevSort) => ({
        key,
        direction:
          prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
      }));
    };

    const getSortDirection = (key) => {
      if (sortConfig.key === key) {
        return sortConfig.direction;
      }
      return null;
    };

    const getPaginatedData = (data) => {
      const filteredData = filterData(data);
      const sortedData = sortData(filteredData);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return {
        paginatedData: sortedData.slice(startIndex, endIndex),
        totalPages: Math.ceil(sortedData.length / itemsPerPage),
        totalItems: sortedData.length,
      };
    };
    const totalContratsPrivePublic = () => {
      setTotalContrats(0);
      data.map((item) => setTotalContrats((prev) => prev + item.nombre_contrats));
    };

    const { paginatedData, totalPages, totalItems } = getPaginatedData(data);

    // Reset pagination when search query or sort changes
    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, sortConfig]);

    const SortableTableHead = ({ children, sortKey, className }) => {
      const direction = getSortDirection(sortKey);

      return (
        <TableHead
          className={`sticky top-0 bg-background group ${className}`}
          onClick={sortKey ? () => requestSort(sortKey) : undefined}
          style={sortKey ? { cursor: "pointer" } : {}}
        >
          <div className="flex items-center justify-between">
            <span>{children}</span>
            {sortKey && (
              <ArrowUpDown
                className={`h-4 w-4 transition-opacity ${
                  direction
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                } ${direction === "desc" ? "rotate-180" : ""}`}
              />
            )}
          </div>
        </TableHead>
      );
    };

    return (
      <div className="flex-1 min-w-[300px] lg:min-w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white hover:text-white"
            onClick={() => onExport(data)}
            variant="outline"
            disabled={loading || exportLoading}
          >
            <FileDown className="h-4 w-4 text-white" />
            {exportLoading ? "Exportation..." : "Exporter vers Excel"}
          </Button>
        </div>
        <div className="border rounded-lg flex flex-col h-[65vh]">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sticky top-0 bg-background">
                    Action
                  </TableHead>
                  <SortableTableHead sortKey="client">Client</SortableTableHead>
                  <SortableTableHead
                    sortKey="nombre_contrats"
                    className="text-right"
                  >
                    Nombre Contrats{" ("}
                    {totalContrats}
                    {")"}
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || initialLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      <div className="flex items-center justify-center h-full">
                        <Loader2Icon className="h-8 w-8 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Aucun résultat trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => (
                    <TableRow key={row.id + row.client}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDetails(row, isPublic)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{row.client}</TableCell>
                      <TableCell className="text-right">
                        {row.nombre_contrats}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t p-2 bg-background">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totalItems} résultats
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Précédent
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Restitutions Contrats</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="months">Nombre de mois</Label>
          <Input
            id="months"
            type="number"
            min="1"
            value={months < 1 ? 1 : months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="search">Rechercher par client</Label>
          <Input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-64"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <ContractsTable
          data={publicContracts}
          title="Contrats Public Arrivé"
          totalContrats={totalContrats}
          onExport={(data) => exportToExcel(data, "contrats_public")}
          isPublic={true}
        />
        <ContractsTable
          data={privateContracts}
          title="Contrats Privé Arrivé"
          totalContrats={totalContrats}
          onExport={(data) => exportToExcel(data, "contrats_prive")}
          isPublic={false}
        />
      </div>

      <ContractDetailsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientCode={selectedClient}
        isPublic={isPublicSelected}
        months={months}
      />
    </div>
  );
}
