"use client";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import SectionCardsLoader from "./Loader";
import Link from "next/link";

export function SectionCards({ isLoading }) {
  const [totalContracts, setTotalContracts] = useState(0);
  const [parcParClient, setParcParClient] = useState(0);
  const [vehiculeVendu, setVehiculeVendu] = useState(0);
  const [vehiculeVenduLY, setVehiculeVenduLY] = useState(0);
  const [totalSinistre, setTotalSinistre] = useState(0);
  const [totalSinistreX, setTotalSinistreX] = useState(0);
  const [trend1, setTrend1] = useState(null);
  const [trend2, setTrend2] = useState(null);
  const [loading, setLoading] = useState(true); // State for loading
  const [pourcentageSinistre, setPourcentageSinistre] = useState(0);
  const [pourcentageVO, setPourcentageVO] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Using Promise.all to fetch all data simultaneously
        const [res1, res2, res3, res4, res5, res6] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/contrat-daba`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/totalclient`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/total_vo_ly`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/total_vo`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/TOTAL_SINISTRE`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/TOTAL_SINISTRE_1`),
        ]);

        // Parsing all responses in parallel
        const [data1, data2, data3, data4, data5, data6] = await Promise.all([
          res1.json(),
          res2.json(),
          res3.json(),
          res4.json(),
          res5.json(),
          res6.json(),
        ]);

        // Setting the state with fetched data
        setTotalContracts(data1[0].totalContrat);
        setParcParClient(
          (data1[0].totalContrat / data2[0].totaleClient).toFixed(0)
        );
        setVehiculeVenduLY(data3[0].totalLastYear);
        setVehiculeVendu(data4[0].TotalCount);
        setTotalSinistre(data5[0].TOTAL);
        setTotalSinistreX(data6[0].TOTAL);

        let ps1 = (data4[0].TotalCount * 100) / data3[0].totalLastYear - 100;
        console.log(ps1 + "%");
        setPourcentageVO(ps1);

        let ps2 = (data5[0].TOTAL * 100) / data6[0].TOTAL - 100;
        setPourcentageSinistre(ps2.toFixed(2));

        // Calculate trend1 based on the data

        if (ps1 > 0) {
          setTrend1("up");
        } else if (ps1 < 0) {
          setTrend1("down");
        } else {
          setTrend1("equal");
        }

        // Calculate trend2 based on the data
        if (ps2 > 0) {
          setTrend2("up");
        } else if (ps2 < 0) {
          setTrend2("down");
        } else {
          setTrend2("equal");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false after data fetch
      }
    };

    fetchData();
  }, []); // Empty array to ensure fetchData runs only once on mount

  if (loading && isLoading) {
    return <SectionCardsLoader />; // Show a loading indicator while data is being fetched
  }

  const trend1_Style = () => {
    if (trend1 == +"up") {
      return " text-green-600 border-green-300 bg-green-50";
    } else if (trend1 === "down") {
      return " text-red-600 border-red-300 bg-red-50";
    } else {
      return " text-yellow-600 border-yellow-300 bg-yellow-50";
    }
  };
  const trend2_Style = () => {
    if (trend2 == +"up") {
      return " text-red-600 border-red-300 bg-red-50";
    } else if (trend2 === "down") {
      return " text-green-600 border-green-300 bg-green-50";
    } else {
      return " text-yellow-600 border-yellow-300 bg-yellow-50";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card transition-shadow hover:shadow-md rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/10 backdrop-blur-sm">
        <Link href="/contrat-actuel">
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                Total Contracts
              </CardTitle>
              <CardTitle className="text-3xl font-bold tabular-nums text-foreground @[250px]/card:text-4xl">
                {totalContracts}
              </CardTitle>
            </div>
            <CardAction>
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20"
              >
                <IconTrendingUp className="size-4 animate-pulse" />
                <span>0</span>
              </Badge>
            </CardAction>
          </CardHeader>
        </Link>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-2">
          <div className="flex gap-2 font-medium items-center text-green-600 dark:text-green-400">
            Actifs en ce moment
          </div>
          {/* <div className="text-muted-foreground text-xs">
            Visitors for the last 6 months
          </div> */}
        </CardFooter>
      </Card>

      <Card className="@container/card transition-shadow hover:shadow-md rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/10 backdrop-blur-sm">
        <Link href="/parc-par-client">
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                Parc moyen Par Client
              </CardTitle>
              <CardTitle className="text-3xl font-bold tabular-nums text-foreground @[250px]/card:text-4xl">
                {parcParClient}
              </CardTitle>
            </div>
            <CardAction>
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20"
              >
                <IconTrendingDown className="size-4 animate-pulse" />
                <span>-20%</span>
              </Badge>
            </CardAction>
          </CardHeader>
        </Link>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-2">
          <div className="flex gap-2 font-medium items-center text-red-600 dark:text-red-400">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          {/* <div className="text-muted-foreground text-xs">
            Acquisition needs attention
          </div> */}
        </CardFooter>
      </Card>

      <Card className="@container/card transition-shadow hover:shadow-md rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/10 backdrop-blur-sm">
        <Link href="/vehicules-vendus">
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                Vehicule Vendu (cette année)
              </CardTitle>
              <CardTitle className="text-3xl font-bold tabular-nums text-foreground @[250px]/card:text-4xl">
                {vehiculeVendu}
              </CardTitle>
            </div>
            <CardAction>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 ${trend1_Style()}`}
              >
                {trend1 === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
                <span>{pourcentageVO.toFixed(2)}%</span>
              </Badge>
            </CardAction>
          </CardHeader>
        </Link>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-2">
          <div
            className={`flex gap-2 font-medium items-center ${
              trend1 === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend1 === "up"
              ? `Plus que l'année précédente`
              : `Moins que l'année précédente`}
            {trend1 === "up" ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          {/* <div className="text-muted-foreground text-xs">
            Engagement exceed targets
          </div> */}
        </CardFooter>
      </Card>

      <Card className="@container/card transition-shadow hover:shadow-md rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/10 backdrop-blur-sm">
        <Link href="/sinistres">
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                Total Sinistre (ce mois)
              </CardTitle>
              <CardTitle className="text-3xl font-bold tabular-nums text-foreground @[250px]/card:text-4xl">
                {totalSinistre}
              </CardTitle>
            </div>
            <CardAction>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 dark:bg-yellow-900/20 ${trend2_Style()}`}
              >
                {trend2 === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
                <span>{pourcentageSinistre}%</span>
              </Badge>
            </CardAction>
          </CardHeader>
        </Link>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-2">
          <div
            className={`flex gap-2 font-medium items-center ${
              trend2 === "up" ? "text-red-600" : "text-green-600"
            } bg-none`}
          >
            {trend2 === "up"
              ? "Le nombre de sinistres a augmenté"
              : "Le nombre de sinistres a diminué"}
            {trend2 === "up" ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          {/* <div className="text-muted-foreground text-xs">
            Meets growth projections
          </div> */}
        </CardFooter>
      </Card>
    </div>
  );
}
