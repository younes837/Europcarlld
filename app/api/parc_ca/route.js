import { NextResponse } from "next/server";
import sql from "mssql";
import { config } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Récupération des paramètres de requête
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 50;
    const immatricule = searchParams.get("immatricule") || "";
    const date_debut = searchParams.get("date_debut") || "";
    const date_fin = searchParams.get("date_fin") || "";
    
    // Calcul de l'offset pour la pagination
    const offset = (page - 1) * pageSize;
    
    const pool = await sql.connect(config);
    const request = pool.request();
    
    // Construction de la clause WHERE de manière sécurisée
    let whereConditions = ["1=1"];
    
    if (immatricule && immatricule.trim() !== "") {
      whereConditions.push(`[F091IMMA] = @immatricule`);
      request.input('immatricule', sql.VarChar, immatricule);
    }
    
    if (date_debut && date_fin) {
      whereConditions.push(`[DATE_FAC] BETWEEN @date_debut AND @date_fin`);
      request.input('date_debut', sql.Date, date_debut);
      request.input('date_fin', sql.Date, date_fin);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Requête pour les données paginées
    const dataQuery = `
      WITH PaginatedData AS (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY [DATE_FAC] DESC) as id,
          [CONTRAT],
          [TIERS],
          [UNITE],
          [F090LIB],
          [N_FACTURE],
          [DATE_FAC],
          [HT],
          [TTC],
          [F091IMMA],
          [F570DTDEP],
          [F570DTARR],
          [PRIX_ACHAT],
          [F090DTMISC]
        FROM [LOCPRO_ALSYS].[dbo].[ca_voiture]
        ${whereClause}
      )
      SELECT *
      FROM PaginatedData
      WHERE id > @offset AND id <= @offsetEnd
    `;
    
    // Requête pour les statistiques
    const summaryQuery = `
      SELECT 
        COUNT(*) as totalCount,
        COUNT(DISTINCT [F091IMMA]) as uniqueVehiclesCount,
        COUNT(DISTINCT [CONTRAT]) as totalContracts,
        SUM([HT]) as totalHT,
        SUM([TTC]) as totalTTC
      FROM [LOCPRO_ALSYS].[dbo].[ca_voiture]
      ${whereClause}
    `;
    
    // Ajout des paramètres pour la pagination
    request.input('offset', sql.Int, offset);
    request.input('offsetEnd', sql.Int, offset + pageSize);
    
    // Exécuter les deux requêtes en parallèle
    const [dataResult, summaryResult] = await Promise.all([
      request.query(dataQuery),
      request.query(summaryQuery)
    ]);
    
    // Préparer les résultats
    const summary = summaryResult.recordset[0];
    
    // Formatage des résultats
    return NextResponse.json({
      items: dataResult.recordset,
      total: summary.totalCount,
      summary: {
        totalHT: summary.totalHT || 0,
        totalTTC: summary.totalTTC || 0,
        uniqueVehiclesCount: summary.uniqueVehiclesCount || 0,
        totalContracts: summary.totalContracts || 0
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des données de CA par véhicule:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
} 