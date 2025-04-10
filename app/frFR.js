// French localization for DataGrid
const frFR = {
  components: {
    MuiDataGrid: {
      defaultProps: {
        localeText: {
          noRowsLabel: 'Aucune donnée',
          noResultsOverlayLabel: 'Aucun résultat trouvé.',
          errorOverlayDefaultLabel: 'Une erreur est survenue.',
          
          // Toolbar
          toolbarDensity: 'Densité',
          toolbarDensityLabel: 'Densité',
          toolbarDensityCompact: 'Compact',
          toolbarDensityStandard: 'Standard',
          toolbarDensityComfortable: 'Confortable',
          
          // Columns selector toolbar button text
          toolbarColumns: 'Colonnes',
          toolbarColumnsLabel: 'Sélectionner les colonnes',
          
          // Filters toolbar button text
          toolbarFilters: 'Filtres',
          toolbarFiltersLabel: 'Afficher les filtres',
          toolbarFiltersTooltipHide: 'Masquer les filtres',
          toolbarFiltersTooltipShow: 'Afficher les filtres',
          toolbarFiltersTooltipActive: (count) =>
            count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
          
          // Quick filter toolbar field
          toolbarQuickFilterPlaceholder: 'Rechercher…',
          toolbarQuickFilterLabel: 'Rechercher',
          toolbarQuickFilterDeleteIconLabel: 'Effacer',
          
          // Export selector toolbar button text
          toolbarExport: 'Exporter',
          toolbarExportLabel: 'Exporter',
          toolbarExportCSV: 'Télécharger en CSV',
          toolbarExportPrint: 'Imprimer',
          toolbarExportExcel: 'Télécharger en Excel',
          
          // Columns management text
          columnsManagementSearchTitle: 'Rechercher',
          columnsManagementNoColumns: 'Aucune colonne',
          columnsManagementShowHideAllText: 'Afficher/Masquer tout',
          columnsManagementReset: 'Réinitialiser',
          columnsManagementDeleteIconLabel: 'Effacer',
          
          // Columns
          columnsPanelTextFieldLabel: 'Trouver une colonne',
          columnsPanelTextFieldPlaceholder: 'Titre de la colonne',
          columnsPanelDragIconLabel: 'Réorganiser la colonne',
          columnsPanelShowAllButton: 'Tout afficher',
          columnsPanelHideAllButton: 'Tout masquer',
          
          // Filters
          filterPanelAddFilter: 'Ajouter un filtre',
          filterPanelRemoveAll: 'Supprimer tout',
          filterPanelDeleteIconLabel: 'Supprimer',
          filterPanelLogicOperator: 'Opérateur logique',
          filterPanelOperator: 'Opérateur',
          filterPanelOperatorAnd: 'Et',
          filterPanelOperatorOr: 'Ou',
          filterPanelColumns: 'Colonnes',
          filterPanelInputLabel: 'Valeur',
          filterPanelInputPlaceholder: 'Valeur du filtre',
          
          // Filter operators
          filterOperatorContains: 'contient',
          filterOperatorDoesNotContain: 'ne contient pas',
          filterOperatorEquals: 'égal à',
          filterOperatorDoesNotEqual: 'différent de',
          filterOperatorStartsWith: 'commence par',
          filterOperatorEndsWith: 'se termine par',
          filterOperatorIs: 'est',
          filterOperatorNot: 'n\'est pas',
          filterOperatorAfter: 'est après',
          filterOperatorOnOrAfter: 'est le ou après',
          filterOperatorBefore: 'est avant',
          filterOperatorOnOrBefore: 'est le ou avant',
          filterOperatorIsEmpty: 'est vide',
          filterOperatorIsNotEmpty: 'n\'est pas vide',
          filterOperatorIsAnyOf: 'est l\'un de',
          'filterOperator=': '=',
          'filterOperator!=': '!=',
          'filterOperator>': '>',
          'filterOperator>=': '>=',
          'filterOperator<': '<',
          'filterOperator<=': '<=',
          
          // Header filter operators text
          headerFilterOperatorContains: 'Contient',
          headerFilterOperatorDoesNotContain: 'Ne contient pas',
          headerFilterOperatorEquals: 'Égal à',
          headerFilterOperatorDoesNotEqual: 'Différent de',
          headerFilterOperatorStartsWith: 'Commence par',
          headerFilterOperatorEndsWith: 'Se termine par',
          headerFilterOperatorIs: 'Est',
          headerFilterOperatorNot: 'N\'est pas',
          headerFilterOperatorAfter: 'Est après',
          headerFilterOperatorOnOrAfter: 'Est le ou après',
          headerFilterOperatorBefore: 'Est avant',
          headerFilterOperatorOnOrBefore: 'Est le ou avant',
          headerFilterOperatorIsEmpty: 'Est vide',
          headerFilterOperatorIsNotEmpty: 'N\'est pas vide',
          headerFilterOperatorIsAnyOf: 'Est l\'un de',
          'headerFilterOperator=': 'Égal à',
          'headerFilterOperator!=': 'Différent de',
          'headerFilterOperator>': 'Supérieur à',
          'headerFilterOperator>=': 'Supérieur ou égal à',
          'headerFilterOperator<': 'Inférieur à',
          'headerFilterOperator<=': 'Inférieur ou égal à',
          
          // Filter values text
          filterValueAny: 'tout',
          filterValueTrue: 'vrai',
          filterValueFalse: 'faux',
          
          // Column menu
          columnMenuLabel: 'Menu',
          columnMenuAriaLabel: (columnName) => `Menu de la colonne ${columnName}`,
          columnMenuShowColumns: 'Afficher les colonnes',
          columnMenuManageColumns: 'Gérer les colonnes',
          columnMenuFilter: 'Filtrer',
          columnMenuHideColumn: 'Masquer la colonne',
          columnMenuUnsort: 'Annuler le tri',
          columnMenuSortAsc: 'Trier par ordre croissant',
          columnMenuSortDesc: 'Trier par ordre décroissant',
          
          // Column header text
          columnHeaderFiltersTooltipActive: (count) =>
            count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
          columnHeaderFiltersLabel: 'Afficher les filtres',
          columnHeaderSortIconLabel: 'Trier',
          
          // Pagination
          footerRowSelected: count => count !== 1
            ? `${count.toLocaleString('fr-FR')} lignes sélectionnées`
            : `${count.toLocaleString('fr-FR')} ligne sélectionnée`,
          footerTotalRows: 'Lignes totales:',
          footerTotalVisibleRows: (visibleCount, totalCount) =>
            `${visibleCount.toLocaleString('fr-FR')} sur ${totalCount.toLocaleString('fr-FR')}`,
          footerPaginationRowsPerPage: 'Lignes par page:',
          footerPaginationRowsPerPageLabel: 'Lignes par page',
          footerPaginationRowsPerPageAll: 'Toutes',
          footerPaginationRowsPerPageOptions: [5, 10, 25, 50, 100],
          footerPaginationRowsPerPageText: (from, to, count) => 
            `${from.toLocaleString('fr-FR')} sur ${count.toLocaleString('fr-FR')}`,
            
          // Checkbox selection text
          checkboxSelectionHeaderName: 'Sélection par case à cocher',
          checkboxSelectionSelectAllRows: 'Sélectionner toutes les lignes',
          checkboxSelectionUnselectAllRows: 'Désélectionner toutes les lignes',
          checkboxSelectionSelectRow: 'Sélectionner la ligne',
          checkboxSelectionUnselectRow: 'Désélectionner la ligne',
          
          // Boolean cell text
          booleanCellTrueLabel: 'oui',
          booleanCellFalseLabel: 'non',
          
          // Actions cell more text
          actionsCellMore: 'plus',
          
          // Column pinning text
          pinToLeft: 'Épingler à gauche',
          pinToRight: 'Épingler à droite',
          unpin: 'Désépingler',
          
          // Tree Data
          treeDataGroupingHeaderName: 'Groupe',
          treeDataExpand: 'voir les enfants',
          treeDataCollapse: 'masquer les enfants',
          
          // Grouping columns
          groupingColumnHeaderName: 'Groupe',
          groupColumn: (name) => `Grouper par ${name}`,
          unGroupColumn: (name) => `Arrêter le groupement par ${name}`,
          
          // Master/detail
          detailPanelToggle: 'Basculer le panneau de détails',
          expandDetailPanel: 'Développer',
          collapseDetailPanel: 'Réduire',
          
          // Row reordering text
          rowReorderingHeaderName: 'Réorganisation des lignes',
          
          // Aggregation
          aggregationMenuItemHeader: 'Agrégation',
          aggregationFunctionLabelSum: 'somme',
          aggregationFunctionLabelAvg: 'moyenne',
          aggregationFunctionLabelMin: 'minimum',
          aggregationFunctionLabelMax: 'maximum',
          aggregationFunctionLabelSize: 'taille',
        },
      },
    },
  },
};

export default frFR; 