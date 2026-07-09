export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export interface Translations {
  // Common
  common: {
    appName: string;
    loading: string;
    error: string;
    tryAgain: string;
    goHome: string;
    close: string;
    save: string;
    delete: string;
    cancel: string;
    confirm: string;
    yes: string;
    no: string;
    free: string;
    new: string;
    edit: string;
    create: string;
    update: string;
    back: string;
    next: string;
    previous: string;
    more: string;
    less: string;
    copy: string;
    copied: string;
    share: string;
    download: string;
    print: string;
  };

  // Nav
  nav: {
    home: string;
    studio: string;
    gallery: string;
    wall: string;
    history: string;
  };

  // Landing page
  landing: {
    tagline: string;
    subtitle: string;
    ctaPrimary: string;
    features: {
      glamGlossy: string;
      vintageFilm: string;
      mobileDesktop: string;
      gorgeousVibes: string;
      filtersCaptions: string;
    };
    testimonials: {
      title: string;
      subtitle: string;
    };
    footer: string;
  };

  // Studio
  studio: {
    title: string;
    subtitle: string;
    startCapture: string;
    captureAgain: string;
    usePhoto: string;
    cameraAccess: string;
    cameraError: string;
    upload: string;
    uploadPlaceholder: string;
  };

  // Editor
  editor: {
    title: string;
    tabs: {
      filters: string;
      adjust: string;
      frame: string;
      stickers: string;
      text: string;
      layers: string;
    };
    filters: {
      cherry: string;
      noir: string;
      cyber: string;
      vintage: string;
      natural: string;
    };
    adjustments: {
      brightness: string;
      contrast: string;
      saturation: string;
      warmth: string;
    };
    frame: {
      title: string;
    };
    stickers: {
      title: string;
      textBadges: string;
      y2k: string;
      college: string;
      flowers: string;
      ribbon: string;
      add: string;
      remove: string;
      clear: string;
    };
    text: {
      title: string;
      placeholder: string;
      fontFamily: string;
      size: string;
      addText: string;
    };
    layers: {
      title: string;
      opacity: string;
      moveUp: string;
      moveDown: string;
    };
    actions: {
      undo: string;
      redo: string;
      clearAll: string;
      confirmClear: string;
    };
  };

  // Export
  exportPanel: {
    title: string;
    captionPlaceholder: string;
    printReady: string;
    shareTitle: string;
    shareSubtitle: string;
    qrCode: string;
    copyLink: string;
    nativeShare: string;
    downloadPNG: string;
    printPDF: string;
    success: string;
  };

  // Gallery
  gallery: {
    title: string;
    empty: string;
    public: string;
    private: string;
    views: string;
    downloads: string;
  };

  // Wall
  wall: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    messages: string;
  };

  // History
  history: {
    title: string;
    empty: string;
    deleteConfirm: string;
  };

  // WhatsNew
  whatsNew: {
    title: string;
    freshUpdates: string;
    gotIt: string;
    changes: {
      textOverlays: string;
      textOverlaysDesc: string;
      layerOpacity: string;
      layerOpacityDesc: string;
      layerStacking: string;
      layerStackingDesc: string;
    };
  };

  // Offline
  offline: {
    title: string;
    subtitle: string;
    cta: string;
  };

  // Admin
  admin: {
    title: string;
    dashboard: string;
    templates: string;
    stickers: string;
    gallery: string;
    sessions: string;
    analytics: string;
    settings: string;
    audit: string;
    login: string;
    passwordRequired: string;
    logout: string;
  };

  // Settings
  settings: {
    language: string;
  };
}

export const defaultTranslations: Partial<Record<Locale, Translations>> = {
  en: {
    common: {
      appName: 'ClickStudio',
      loading: 'Loading...',
      error: 'Error',
      tryAgain: 'Try Again',
      goHome: 'Go Home',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      cancel: 'Cancel',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      free: 'Free',
      new: 'New',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      more: 'More',
      less: 'Less',
      copy: 'Copy',
      copied: 'Copied!',
      share: 'Share',
      download: 'Download',
      print: 'Print',
    },
    nav: {
      home: 'Home',
      studio: 'Studio',
      gallery: 'Gallery',
      wall: 'Wall',
      history: 'My Strips',
    },
    landing: {
      tagline: 'Own Your Shot.\nCelebrate Yourself.',
      subtitle: 'The ultimate browser-based photo booth. Pick a gorgeous vibe, strike a pose, and download instant high-res strips. No signup, no gatekeeping — just pure fun.',
      ctaPrimary: 'Start the Studio',
      features: {
        glamGlossy: '💄 Glam & Glossy',
        vintageFilm: '⚡ Vintage Film',
        mobileDesktop: 'Mobile & Desktop Ready',
        gorgeousVibes: 'Gorgeous Vibes',
        filtersCaptions: 'Filters & Captions',
      },
      testimonials: {
        title: 'Loved by Besties Everywhere',
        subtitle: 'Hear from real creators who use ClickStudio to capture their vibe.',
      },
      footer: '© {year} ClickStudio. Built with 💖 for confident self-expression. No tracking, no ads.',
    },
    studio: {
      title: 'ClickStudio',
      subtitle: 'Your Photo Booth',
      startCapture: 'Start Capture',
      captureAgain: 'Capture Again',
      usePhoto: 'Use Photo',
      cameraAccess: 'Allow camera access to take photos',
      cameraError: 'Could not access camera',
      upload: 'Upload',
      uploadPlaceholder: 'Drag & drop or click to upload',
    },
    editor: {
      title: 'Editor',
      tabs: {
        filters: '1. Filters',
        adjust: '2. Adjust',
        frame: '3. Frame',
        stickers: '4. Stickers',
        text: '5. Text',
        layers: 'Layers',
      },
      filters: {
        cherry: 'Cherry Blossom',
        noir: 'Noir Classic',
        cyber: 'Y2K Cyber',
        vintage: 'Vintage Film',
        natural: 'Natural',
      },
      adjustments: {
        brightness: 'Brightness',
        contrast: 'Contrast',
        saturation: 'Saturation',
        warmth: 'Warmth',
      },
      frame: {
        title: 'Frame Style',
      },
      stickers: {
        title: 'Stickers',
        textBadges: 'Text Badges',
        y2k: 'Y2K',
        college: 'College 🎓',
        flowers: 'Flowers 🌸',
        ribbon: 'Ribbon 🎀',
        add: 'Add',
        remove: 'Remove',
        clear: 'Clear',
      },
      text: {
        title: 'Text Overlays',
        placeholder: 'Type something...',
        fontFamily: 'Font',
        size: 'Size',
        addText: 'Add Text',
      },
      layers: {
        title: 'Layers',
        opacity: 'Opacity',
        moveUp: 'Move Up',
        moveDown: 'Move Down',
      },
      actions: {
        undo: 'Undo',
        redo: 'Redo',
        clearAll: 'Clear All',
        confirmClear: 'Are you sure you want to clear all layers?',
      },
    },
    exportPanel: {
      title: 'Export Your Strip',
      captionPlaceholder: 'Add a caption...',
      printReady: 'Print-Ready PDF',
      shareTitle: 'Share Your Strip',
      shareSubtitle: 'Spread the vibe with your friends',
      qrCode: 'QR Code',
      copyLink: 'Copy Link',
      nativeShare: 'Share',
      downloadPNG: 'Download PNG',
      printPDF: 'Print PDF',
      success: 'Strip saved!',
    },
    gallery: {
      title: 'Gallery',
      empty: 'No strips yet. Be the first to share!',
      public: 'Public',
      private: 'Private',
      views: '{count} views',
      downloads: '{count} downloads',
    },
    wall: {
      title: 'Feedback Wall',
      subtitle: 'Leave a message for everyone',
      placeholder: 'Say something nice...',
      send: 'Send',
      messages: '{count} messages',
    },
    history: {
      title: 'My Strips',
      empty: 'No strips yet. Create your first one!',
      deleteConfirm: 'Are you sure you want to delete this strip?',
    },
    whatsNew: {
      title: "What's New",
      freshUpdates: 'Fresh updates',
      gotIt: 'Got it',
      changes: {
        textOverlays: 'Text overlays',
        textOverlaysDesc: 'Add your own draggable text on top of the strip with fonts, colors, and sizing.',
        layerOpacity: 'Layer opacity',
        layerOpacityDesc: 'Fade stickers and text layers with a per-layer opacity slider.',
        layerStacking: 'Layer stacking',
        layerStackingDesc: 'Use the up/down arrows to reorder stickers or text within each layer list.',
      },
    },
    offline: {
      title: 'Offline',
      subtitle: 'You are currently offline. Some features may not work.',
      cta: 'Go to Studio',
    },
    admin: {
      title: 'Admin',
      dashboard: 'Dashboard',
      templates: 'Templates',
      stickers: 'Stickers',
      gallery: 'Gallery',
      sessions: 'Sessions',
      analytics: 'Analytics',
      settings: 'Settings',
      audit: 'Audit Log',
      login: 'Login',
      passwordRequired: 'Password required',
      logout: 'Logout',
    },
    settings: {
      language: 'Language',
    },
  },
  es: {
    common: {
      appName: 'ClickStudio',
      loading: 'Cargando...',
      error: 'Error',
      tryAgain: 'Intentar de nuevo',
      goHome: 'Ir a inicio',
      close: 'Cerrar',
      save: 'Guardar',
      delete: 'Eliminar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      free: 'Gratis',
      new: 'Nuevo',
      edit: 'Editar',
      create: 'Crear',
      update: 'Actualizar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      more: 'Más',
      less: 'Menos',
      copy: 'Copiar',
      copied: '¡Copiado!',
      share: 'Compartir',
      download: 'Descargar',
      print: 'Imprimir',
    },
    nav: {
      home: 'Inicio',
      studio: 'Estudio',
      gallery: 'Galería',
      wall: 'Muro',
      history: 'Mis Tiras',
    },
    landing: {
      tagline: 'Sé dueño de tu foto.\nCelebrate tu esencia.',
      subtitle: 'El mejor fotomatón basado en navegador. Elige un estilo increíble, posiona y descarga tiras de alta resolución al instante. Sin registro, sin restricciones, solo diversión.',
      ctaPrimary: 'Empezar Estudio',
      features: {
        glamGlossy: '💄 Glamour y Brillo',
        vintageFilm: '⚡ Película Vintage',
        mobileDesktop: 'Listo para Móvil y Escritorio',
        gorgeousVibes: 'Estilos Increíbles',
        filtersCaptions: 'Filtros y Leyendas',
      },
      testimonials: {
        title: 'Amado por los mejores amigos',
        subtitle: 'Escucha a creadores reales que usan ClickStudio para capturar su estilo.',
      },
      footer: '© {year} ClickStudio. Hecho con 💖 para la autoexpresión segura. Sin seguimiento, sin anuncios.',
    },
    studio: {
      title: 'ClickStudio',
      subtitle: 'Tu Fotomatón',
      startCapture: 'Iniciar Captura',
      captureAgain: 'Capturar de nuevo',
      usePhoto: 'Usar Foto',
      cameraAccess: 'Permite el acceso a la cámara para tomar fotos',
      cameraError: 'No se pudo acceder a la cámara',
      upload: 'Subir',
      uploadPlaceholder: 'Arrastra y suelta o haz clic para subir',
    },
    editor: {
      title: 'Editor',
      tabs: {
        filters: '1. Filtros',
        adjust: '2. Ajustar',
        frame: '3. Marco',
        stickers: '4. Pegatinas',
        text: '5. Texto',
        layers: 'Capas',
      },
      filters: {
        cherry: 'Flor de Cerezo',
        noir: 'Clásico Noir',
        cyber: 'Y2K Cyber',
        vintage: 'Película Vintage',
        natural: 'Natural',
      },
      adjustments: {
        brightness: 'Brillo',
        contrast: 'Contraste',
        saturation: 'Saturación',
        warmth: 'Calidez',
      },
      frame: {
        title: 'Estilo de Marco',
      },
      stickers: {
        title: 'Pegatinas',
        textBadges: 'Pegatinas de Texto',
        y2k: 'Y2K',
        college: 'Universidad 🎓',
        flowers: 'Flores 🌸',
        ribbon: 'Cinta 🎀',
        add: 'Añadir',
        remove: 'Eliminar',
        clear: 'Limpiar',
      },
      text: {
        title: 'Textos Superpuestos',
        placeholder: 'Escribe algo...',
        fontFamily: 'Fuente',
        size: 'Tamaño',
        addText: 'Añadir Texto',
      },
      layers: {
        title: 'Capas',
        opacity: 'Opacidad',
        moveUp: 'Subir',
        moveDown: 'Bajar',
      },
      actions: {
        undo: 'Deshacer',
        redo: 'Rehacer',
        clearAll: 'Limpiar Todo',
        confirmClear: '¿Estás seguro de que quieres eliminar todas las capas?',
      },
    },
    exportPanel: {
      title: 'Exporta tu Tira',
      captionPlaceholder: 'Añade una leyenda...',
      printReady: 'PDF Listo para Imprimir',
      shareTitle: 'Comparte tu Tira',
      shareSubtitle: 'Comparte el estilo con tus amigos',
      qrCode: 'Código QR',
      copyLink: 'Copiar Enlace',
      nativeShare: 'Compartir',
      downloadPNG: 'Descargar PNG',
      printPDF: 'Imprimir PDF',
      success: '¡Tira guardada!',
    },
    gallery: {
      title: 'Galería',
      empty: 'No hay tiras aún. ¡Sé el primero en compartir!',
      public: 'Público',
      private: 'Privado',
      views: '{count} vistas',
      downloads: '{count} descargas',
    },
    wall: {
      title: 'Muro de Comentarios',
      subtitle: 'Deja un mensaje para todos',
      placeholder: 'Di algo lindo...',
      send: 'Enviar',
      messages: '{count} mensajes',
    },
    history: {
      title: 'Mis Tiras',
      empty: 'No hay tiras aún. ¡Crea tu primera!',
      deleteConfirm: '¿Estás seguro de que quieres eliminar esta tira?',
    },
    whatsNew: {
      title: '¿Qué hay de nuevo?',
      freshUpdates: 'Novedades',
      gotIt: 'Entendido',
      changes: {
        textOverlays: 'Textos superpuestos',
        textOverlaysDesc: 'Añade tu propio texto arrastrable sobre la tira con fuentes, colores y tamaños.',
        layerOpacity: 'Opacidad de capas',
        layerOpacityDesc: 'Ajusta la opacidad de pegatinas y textos con un control deslizante por capa.',
        layerStacking: 'Orden de capas',
        layerStackingDesc: 'Usa las flechas arriba/abajo para reordenar pegatinas o textos en cada lista.',
      },
    },
    offline: {
      title: 'Sin conexión',
      subtitle: 'Actualmente estás sin conexión. Algunas funciones pueden no estar disponibles.',
      cta: 'Ir al Estudio',
    },
    admin: {
      title: 'Administrador',
      dashboard: 'Panel',
      templates: 'Plantillas',
      stickers: 'Pegatinas',
      gallery: 'Galería',
      sessions: 'Sesiones',
      analytics: 'Analíticas',
      settings: 'Configuración',
      audit: 'Registro de Auditoría',
      login: 'Iniciar sesión',
      passwordRequired: 'Contraseña requerida',
      logout: 'Cerrar sesión',
    },
    settings: {
      language: 'Idioma',
    },
  },
  fr: {
    common: {
      appName: 'ClickStudio',
      loading: 'Chargement...',
      error: 'Erreur',
      tryAgain: 'Réessayer',
      goHome: "Aller à l'accueil",
      close: 'Fermer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      free: 'Gratuit',
      new: 'Nouveau',
      edit: 'Modifier',
      create: 'Créer',
      update: 'Mettre à jour',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      more: 'Plus',
      less: 'Moins',
      copy: 'Copier',
      copied: 'Copié !',
      share: 'Partager',
      download: 'Télécharger',
      print: 'Imprimer',
    },
    nav: {
      home: 'Accueil',
      studio: 'Studio',
      gallery: 'Galerie',
      wall: 'Mur',
      history: 'Mes bandes',
    },
    landing: {
      tagline: 'Prenez votre photo.\nCélébrez-vous.',
      subtitle: "Le photomaton ultime basé sur navigateur. Choisissez une ambiance sublime, prenez la pose et téléchargez des bandes haute résolution instantanément. Pas d'inscription, pas de restrictions, juste du plaisir.",
      ctaPrimary: 'Démarrer le Studio',
      features: {
        glamGlossy: '💄 Glamour & Brillant',
        vintageFilm: '⚡ Film Vintage',
        mobileDesktop: 'Prêt pour Mobile & Bureau',
        gorgeousVibes: 'Ambiance Superbe',
        filtersCaptions: 'Filtres & Légendes',
      },
      testimonials: {
        title: 'Adoré par les meilleurs amis',
        subtitle: "Découvrez ce que les vrais créateurs pensent de ClickStudio pour capturer leur style.",
      },
      footer: '© {year} ClickStudio. Construite avec 💖 pour une auto-expression confiante. Pas de suivi, pas de publicité.',
    },
    studio: {
      title: 'ClickStudio',
      subtitle: 'Votre Photomaton',
      startCapture: 'Démarrer la capture',
      captureAgain: 'Capturer à nouveau',
      usePhoto: 'Utiliser la photo',
      cameraAccess: "Autorisez l'accès à la caméra pour prendre des photos",
      cameraError: 'Impossible d\'accéder à la caméra',
      upload: 'Télécharger',
      uploadPlaceholder: 'Glissez-déposez ou cliquez pour télécharger',
    },
    editor: {
      title: 'Éditeur',
      tabs: {
        filters: '1. Filtres',
        adjust: '2. Ajuster',
        frame: '3. Cadre',
        stickers: '4. Autocollants',
        text: '5. Texte',
        layers: 'Calques',
      },
      filters: {
        cherry: 'Fleur de Cerisier',
        noir: 'Noir Classique',
        cyber: 'Y2K Cyber',
        vintage: 'Film Vintage',
        natural: 'Naturel',
      },
      adjustments: {
        brightness: 'Luminosité',
        contrast: 'Contraste',
        saturation: 'Saturation',
        warmth: 'Chaleur',
      },
      frame: {
        title: 'Style de Cadre',
      },
      stickers: {
        title: 'Autocollants',
        textBadges: 'Badges Texte',
        y2k: 'Y2K',
        college: 'Université 🎓',
        flowers: 'Fleurs 🌸',
        ribbon: 'Ruban 🎀',
        add: 'Ajouter',
        remove: 'Retirer',
        clear: 'Effacer',
      },
      text: {
        title: 'Textes Superposés',
        placeholder: 'Écrivez quelque chose...',
        fontFamily: 'Police',
        size: 'Taille',
        addText: 'Ajouter Texte',
      },
      layers: {
        title: 'Calques',
        opacity: 'Opacité',
        moveUp: 'Monter',
        moveDown: 'Descendre',
      },
      actions: {
        undo: 'Annuler',
        redo: 'Rétablir',
        clearAll: 'Tout effacer',
        confirmClear: 'Êtes-vous sûr de vouloir tout effacer ?',
      },
    },
    exportPanel: {
      title: 'Exportez votre bande',
      captionPlaceholder: 'Ajoutez une légende...',
      printReady: 'PDF Prêt à imprimer',
      shareTitle: 'Partagez votre bande',
      shareSubtitle: 'Partagez le style avec vos amis',
      qrCode: 'Code QR',
      copyLink: 'Copier le lien',
      nativeShare: 'Partager',
      downloadPNG: 'Télécharger PNG',
      printPDF: 'Imprimer PDF',
      success: 'Bande enregistrée !',
    },
    gallery: {
      title: 'Galerie',
      empty: 'Aucune bande pour l\'instant. Soyez le premier à partager !',
      public: 'Public',
      private: 'Privé',
      views: '{count} vues',
      downloads: '{count} téléchargements',
    },
    wall: {
      title: 'Mur de commentaires',
      subtitle: 'Laissez un message pour tout le monde',
      placeholder: 'Dites quelque chose de gentil...',
      send: 'Envoyer',
      messages: '{count} messages',
    },
    history: {
      title: 'Mes bandes',
      empty: 'Aucune bande pour l\'instant. Créez votre première !',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette bande ?',
    },
    whatsNew: {
      title: "Quoi de neuf ?",
      freshUpdates: 'Nouvelles mises à jour',
      gotIt: 'Compris',
      changes: {
        textOverlays: 'Textes superposés',
        textOverlaysDesc: 'Ajoutez votre propre texte glissable sur la bande avec des polices, couleurs et tailles.',
        layerOpacity: 'Opacité des calques',
        layerOpacityDesc: 'Ajustez l\'opacité des autocollants et textes avec un curseur par calque.',
        layerStacking: 'Empilement des calques',
        layerStackingDesc: 'Utilisez les flèches haut/bas pour réorganiser les autocollants ou textes dans chaque liste.',
      },
    },
    offline: {
      title: 'Hors ligne',
      subtitle: 'Vous êtes actuellement hors ligne. Certaines fonctions peuvent ne pas fonctionner.',
      cta: 'Aller au Studio',
    },
    admin: {
      title: 'Administrateur',
      dashboard: 'Tableau de bord',
      templates: 'Modèles',
      stickers: 'Autocollants',
      gallery: 'Galerie',
      sessions: 'Sessions',
      analytics: 'Analytique',
      settings: 'Paramètres',
      audit: 'Journal d\'audit',
      login: 'Connexion',
      passwordRequired: 'Mot de passe requis',
      logout: 'Déconnexion',
    },
    settings: {
      language: 'Langue',
    },
  },
};
