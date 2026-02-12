
export interface Prestation {
  type: string;
  nom?: string;
  pax?: string;
  horaires?: string;
  lieu?: string;
}

export interface Allergy {
  nb?: string;
  name?: string;
  restriction?: string;
}

export interface MenuDetails {
  menuName?: string;
  entree?: string;
  plat?: string;
  fromage?: string;
  dessert?: string;
  hasAperitif?: boolean;
  aperitifName?: string;
  aperitifNbPax?: string;
  hasForfaitBoisson?: boolean;
  boissonName?: string;
  vinNb?: string;
  softNb?: string;
  allergies?: Allergy[];
}

export interface SalleDisposition {
  salle: string;
  pax: string;
  format: string;
  materiel?: string;
}

export interface RoomDetails {
  nbChambres: string;
  nbPersonnes: string;
  typeChambre: string;
  notes?: string;
}

export interface TeamBuilding {
  enabled: boolean;
  description: string;
}

export interface DayData {
  date: string;
  prestations: Prestation[];
  dejeunerMenu?: MenuDetails;
  dinerMenu?: MenuDetails;
  sallesDisposition?: SalleDisposition[];
  hebergement?: RoomDetails[];
  teamBuilding?: TeamBuilding;
}

export interface ContactInfo {
  nom: string;
  email: string;
  tel: string;
}

export interface ExtractedEventData {
  entreprise: string;
  secteur?: string;
  contactClient: ContactInfo;
  responsableSurPlace: ContactInfo;
  days: DayData[];
  allergies: Allergy[];
  commentairesEquipe?: string;
  teamBuilding?: { enabled: boolean; date: string; description: string };
  extras?: {
    bar?: string;
    restaurant?: string;
    transfert?: string;
  };
}

export interface SavedEvent extends ExtractedEventData {
  id: string;
  createdAt: string;
  weekNumber: number;
  year: number;
}

export type AppStatus = 'idle' | 'uploading' | 'extracting' | 'completed' | 'error';
export type ViewMode = 'dashboard' | 'import' | 'create' | 'detail' | 'planning' | 'daily-org' | 'weekly-summary' | 'cuisine' | 'restaurant' | 'housekeeping';
