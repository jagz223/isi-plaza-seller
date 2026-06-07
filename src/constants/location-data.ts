export type LocationCountry = {
  name: string;
  dialCode: string;
  flag: string;
  states: string[];
};

/** Misma lista que `config/isi-plaza.php` → consumer.filter_countries */
export const LOCATION_COUNTRIES: LocationCountry[] = [
  {
    name: 'China',
    dialCode: '+86',
    flag: '🇨🇳',
    states: [
      'Guangdong',
      'Zhejiang',
      'Fujian',
      'Jiangsu',
      'Shandong',
      'Shanghai',
      'Beijing',
      'Sichuan',
      'Henan',
      'Hubei',
      'Anhui',
      'Hunan',
      'Liaoning',
      'Hebei',
      'Tianjin',
    ],
  },
  {
    name: 'México',
    dialCode: '+52',
    flag: '🇲🇽',
    states: [
      'Aguascalientes',
      'Baja California',
      'Baja California Sur',
      'Campeche',
      'Chiapas',
      'Chihuahua',
      'Ciudad de México',
      'Coahuila',
      'Colima',
      'Durango',
      'Estado de México',
      'Guanajuato',
      'Guerrero',
      'Hidalgo',
      'Jalisco',
      'Michoacán',
      'Morelos',
      'Nayarit',
      'Nuevo León',
      'Oaxaca',
      'Puebla',
      'Querétaro',
      'Quintana Roo',
      'San Luis Potosí',
      'Sinaloa',
      'Sonora',
      'Tabasco',
      'Tamaulipas',
      'Tlaxcala',
      'Veracruz',
      'Yucatán',
      'Zacatecas',
    ],
  },
  {
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷',
    states: [
      'São Paulo',
      'Rio de Janeiro',
      'Minas Gerais',
      'Bahia',
      'Paraná',
      'Rio Grande do Sul',
      'Pernambuco',
      'Ceará',
      'Pará',
      'Santa Catarina',
      'Goiás',
      'Maranhão',
      'Amazonas',
      'Espírito Santo',
      'Distrito Federal',
    ],
  },
  {
    name: 'Argentina',
    dialCode: '+54',
    flag: '🇦🇷',
    states: [
      'CABA',
      'Buenos Aires',
      'Córdoba',
      'Santa Fe',
      'Mendoza',
      'Tucumán',
      'Entre Ríos',
      'Salta',
      'Chaco',
      'Corrientes',
      'Misiones',
      'Neuquén',
      'Río Negro',
      'San Juan',
      'San Luis',
    ],
  },
  {
    name: 'Colombia',
    dialCode: '+57',
    flag: '🇨🇴',
    states: [
      'Antioquia',
      'Atlántico',
      'Bogotá D.C.',
      'Bolívar',
      'Boyacá',
      'Caldas',
      'Cauca',
      'Cesar',
      'Cundinamarca',
      'Huila',
      'Magdalena',
      'Meta',
      'Nariño',
      'Norte de Santander',
      'Quindío',
      'Risaralda',
      'Santander',
      'Tolima',
      'Valle del Cauca',
    ],
  },
  {
    name: 'Chile',
    dialCode: '+56',
    flag: '🇨🇱',
    states: [
      'Región Metropolitana',
      'Valparaíso',
      'Biobío',
      'Maule',
      'Antofagasta',
      'Araucanía',
      'Los Lagos',
      'Coquimbo',
      'O\'Higgins',
      'Tarapacá',
    ],
  },
  {
    name: 'Perú',
    dialCode: '+51',
    flag: '🇵🇪',
    states: [
      'Lima',
      'Arequipa',
      'La Libertad',
      'Piura',
      'Cusco',
      'Junín',
      'Lambayeque',
      'Ancash',
      'Ica',
      'Puno',
    ],
  },
  {
    name: 'Venezuela',
    dialCode: '+58',
    flag: '🇻🇪',
    states: [
      'Distrito Capital',
      'Miranda',
      'Zulia',
      'Carabobo',
      'Lara',
      'Aragua',
      'Bolívar',
      'Táchira',
      'Mérida',
      'Anzoátegui',
    ],
  },
  {
    name: 'Ecuador',
    dialCode: '+593',
    flag: '🇪🇨',
    states: [
      'Pichincha',
      'Guayas',
      'Azuay',
      'Manabí',
      'El Oro',
      'Tungurahua',
      'Loja',
      'Imbabura',
    ],
  },
  {
    name: 'Bolivia',
    dialCode: '+591',
    flag: '🇧🇴',
    states: [
      'La Paz',
      'Santa Cruz',
      'Cochabamba',
      'Tarija',
      'Oruro',
      'Potosí',
      'Chuquisaca',
      'Beni',
    ],
  },
  {
    name: 'Paraguay',
    dialCode: '+595',
    flag: '🇵🇾',
    states: ['Asunción', 'Alto Paraná', 'Central', 'Itapúa', 'Caaguazú', 'Cordillera'],
  },
  {
    name: 'Uruguay',
    dialCode: '+598',
    flag: '🇺🇾',
    states: ['Montevideo', 'Canelones', 'Maldonado', 'Salto', 'Colonia', 'Paysandú'],
  },
  {
    name: 'Guatemala',
    dialCode: '+502',
    flag: '🇬🇹',
    states: ['Guatemala', 'Quetzaltenango', 'Escuintla', 'Huehuetenango', 'Alta Verapaz', 'Petén'],
  },
  {
    name: 'Costa Rica',
    dialCode: '+506',
    flag: '🇨🇷',
    states: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'],
  },
];

export const COUNTRY_NAMES = LOCATION_COUNTRIES.map((c) => c.name);

/** Prefijo telefónico por defecto (México) en registro de mayoristas. */
export const DEFAULT_WHATSAPP_DIAL_CODE = '+52';

const DIAL_CODES_SORTED = [...LOCATION_COUNTRIES]
  .map((c) => c.dialCode)
  .sort((a, b) => b.length - a.length);

export function getCountryByName(name: string): LocationCountry | undefined {
  return LOCATION_COUNTRIES.find((c) => c.name === name);
}

export function getStatesForCountry(countryName: string): string[] {
  return getCountryByName(countryName)?.states ?? [];
}

export function getDialCodeOptions() {
  return LOCATION_COUNTRIES.map((c) => ({
    value: c.dialCode,
    label: `${c.flag} ${c.dialCode}`,
    searchText: `${c.name} ${c.dialCode} ${c.flag}`,
  }));
}

/** Un solo espacio entre código y número. */
export function formatWhatsapp(dialCode: string, number: string): string {
  const code = dialCode.trim();
  const digits = number.replace(/\s+/g, '').trim();
  if (!code && !digits) return '';
  if (!digits) return code;
  if (!code) return digits;
  return `${code} ${digits}`;
}

export function parseWhatsapp(full: string): { dialCode: string; number: string } {
  const trimmed = full.trim();
  if (!trimmed) {
    return { dialCode: DEFAULT_WHATSAPP_DIAL_CODE, number: '' };
  }

  if (!trimmed.startsWith('+')) {
    return { dialCode: DEFAULT_WHATSAPP_DIAL_CODE, number: trimmed.replace(/\s+/g, '') };
  }

  for (const code of DIAL_CODES_SORTED) {
    if (trimmed.startsWith(code)) {
      const rest = trimmed.slice(code.length).replace(/^\s+/, '').replace(/\s+/g, '');
      return { dialCode: code, number: rest };
    }
  }

  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx > 0) {
    return {
      dialCode: trimmed.slice(0, spaceIdx),
      number: trimmed.slice(spaceIdx + 1).replace(/\s+/g, ''),
    };
  }

  return { dialCode: DEFAULT_WHATSAPP_DIAL_CODE, number: trimmed.replace(/\s+/g, '') };
}
