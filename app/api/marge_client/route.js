const getMargeParClient = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    // Récupération des paramètres de requête
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const isExport = req.query.export === 'true';
    
    // Calcul de l'offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Construire la requête de base
    let whereClause = "WHERE 1=1";
    
    // Ajouter la condition de recherche si nécessaire
    if (search) {
      whereClause += ` AND [Nom client] LIKE @search`;
    }
    
    // Pour l'export, on récupère toutes les données sans pagination
    if (isExport) {
      const query = `
        SELECT [Parc], [Nom client], [LOYER], [MARGE], CAST([RNL] * 100 AS DECIMAL(10,2)) as RNL
        FROM [AlocproProd].[dbo].[calc_grille_offre_rnl]
        ${whereClause}
        ORDER BY MARGE DESC
      `;
      
      const request = pool.request();
      if (search) {
        request.input('search', `%${search}%`);
      }
      
      const result = await request.query(query);
      
      // Calculer les totaux pour l'export
      const distinctParcs = new Set(result.recordset.map(row => row.Parc)).size;
      const totals = {
        totalLoyer: result.recordset.reduce((sum, row) => sum + (row.LOYER || 0), 0),
        totalMarge: result.recordset.reduce((sum, row) => sum + (row.MARGE || 0), 0),
        totalRNL: result.recordset.reduce((sum, row) => sum + (row.RNL || 0), 0),
        totalParcs: distinctParcs
      };
      
      return res.json({ 
        data: result.recordset,
        total: result.recordset.length,
        totals: totals
      });
    }
    
    // Pour la pagination normale, on fait trois requêtes:
    // 1. Une pour récupérer le nombre total d'enregistrements (pour la pagination)
    // 2. Une pour calculer les totaux globaux
    // 3. Une pour récupérer les données de la page actuelle
    
    // 1. Nombre total d'enregistrements
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM [AlocproProd].[dbo].[calc_grille_offre_rnl]
      ${whereClause}
    `;
    
    const countRequest = pool.request();
    if (search) {
      countRequest.input('search', `%${search}%`);
    }
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    
    // 2. Calcul des totaux sur l'ensemble des données
    const totalsQuery = `
      SELECT 
        SUM([LOYER]) as totalLoyer,
        SUM([MARGE]) as totalMarge,
        SUM(CAST([RNL] * 100 AS DECIMAL(10,2))) as totalRNL,
        COUNT(DISTINCT [Parc]) as totalParcs
      FROM [AlocproProd].[dbo].[calc_grille_offre_rnl]
      ${whereClause}
    `;
    
    const totalsRequest = pool.request();
    if (search) {
      totalsRequest.input('search', `%${search}%`);
    }
    
    const totalsResult = await totalsRequest.query(totalsQuery);
    const totals = totalsResult.recordset[0];
    
    // 3. Données de la page actuelle - utilisation de ROW_NUMBER() au lieu de OFFSET/FETCH
    const dataQuery = `
      WITH NumberedResults AS (
        SELECT 
          [Parc], 
          [Nom client], 
          [LOYER], 
          [MARGE], 
          CAST([RNL] * 100 AS DECIMAL(10,2)) as RNL,
          ROW_NUMBER() OVER (ORDER BY MARGE DESC) AS RowNum
        FROM [AlocproProd].[dbo].[calc_grille_offre_rnl]
        ${whereClause}
      )
      SELECT 
        [Parc], 
        [Nom client], 
        [LOYER], 
        [MARGE], 
        [RNL]
      FROM NumberedResults
      WHERE RowNum BETWEEN ${offset + 1} AND ${offset + limit}
    `;
    
    const dataRequest = pool.request();
    if (search) {
      dataRequest.input('search', `%${search}%`);
    }
    
    const dataResult = await dataRequest.query(dataQuery);
    
    // Retourner les données, les totaux et le nombre total pour la pagination
    res.json({
      data: dataResult.recordset,
      total: total,
      totals: totals,
      page: page,
      limit: limit,
      pages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error("Erreur dans getMargeParClient:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 