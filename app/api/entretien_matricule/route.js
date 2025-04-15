const get_entretien_matricule = async (req, res) => {
  try {
    const { matricule, dateDebut, dateFin, page = 1, pageSize = 50 } = req.query;
    const pool = await sql.connect(config);

    // Calcul de l'offset pour la pagination
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // Construction de la clause WHERE de manière sécurisée
    let whereConditions = [];
    const request = pool.request();

    if (matricule && matricule.trim() !== "") {
      whereConditions.push(`F091IMMAT.F091IMMA LIKE @matricule`);
      request.input('matricule', sql.VarChar, `%${matricule}%`);
    }
    if (dateDebut) {
      whereConditions.push(`F400EVT.F400FACDT >= @dateDebut`);
      request.input('dateDebut', sql.Date, dateDebut);
    }
    if (dateFin) {
      whereConditions.push(`F400EVT.F400FACDT <= @dateFin`);
      request.input('dateFin', sql.Date, dateFin);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Requête pour les données paginées
    const dataQuery = `
      WITH PaginatedData AS (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY F400EVT.F400FACDT DESC) as id,
          F091IMMAT.F091IMMA, 
          F090PARC.F090LIB, 
          F400EVT.F400NMDOC, 
          F410LIG.F410MTHT,
          F410LIG.K410100PRO, 
          F410LIG.F410LIB,
          F400EVT.F400FACDT,
          CD.F050NOM
        FROM 
          dbo.F410LIG AS F410LIG 
          INNER JOIN dbo.F090PARC AS F090PARC ON F410LIG.K410090UNI = F090PARC.F090KY 
          LEFT JOIN dbo.F091IMMAT AS F091IMMAT ON F090PARC.K090091IMM = F091IMMAT.F091KY 
          INNER JOIN dbo.F400EVT AS F400EVT ON F410LIG.K410400EVT = F400EVT.F400KY
          LEFT JOIN [Contrat_LLD] AS CD ON F091IMMAT.F091IMMA = CD.F091IMMA
        ${whereClause}
      )
      SELECT *
      FROM PaginatedData
      WHERE id > @offset AND id <= @offsetEnd
    `;

    // Requête pour les statistiques
    const summaryQuery = `
      SELECT 
        COUNT(*) as totalEntretiens,
        COUNT(DISTINCT F091IMMAT.F091IMMA) as uniqueVehiclesCount,
        SUM(F410LIG.F410MTHT) as totalMontant
      FROM 
        dbo.F410LIG AS F410LIG 
        INNER JOIN dbo.F090PARC AS F090PARC ON F410LIG.K410090UNI = F090PARC.F090KY 
        LEFT JOIN dbo.F091IMMAT AS F091IMMAT ON F090PARC.K090091IMM = F091IMMAT.F091KY 
        INNER JOIN dbo.F400EVT AS F400EVT ON F410LIG.K410400EVT = F400EVT.F400KY
        LEFT JOIN [Contrat_LLD] AS CD ON F091IMMAT.F091IMMA = CD.F091IMMA
      ${whereClause}
    `;

    // Ajout des paramètres pour la pagination
    request.input('offset', sql.Int, offset);
    request.input('offsetEnd', sql.Int, offset + parseInt(pageSize));

    // Exécuter les deux requêtes en parallèle
    const [dataResult, summaryResult] = await Promise.all([
      request.query(dataQuery),
      request.query(summaryQuery)
    ]);

    // Traiter les résultats des statistiques
    const summary = summaryResult.recordset[0];
    const montantMoyen = summary.totalEntretiens > 0 
      ? summary.totalMontant / summary.totalEntretiens 
      : 0;

    // Renvoyer les résultats formatés
    res.json({
      items: dataResult.recordset,
      total: summary.totalEntretiens,
      summary: {
        totalMontant: summary.totalMontant || 0,
        totalEntretiens: summary.totalEntretiens || 0,
        montantMoyen: montantMoyen || 0,
        uniqueVehiclesCount: summary.uniqueVehiclesCount || 0
      }
    });
  } catch (error) {
    console.error("Error fetching entretien data:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des données d'entretien" });
  }
}; 