export const MOCK_WHOLESALER_PROFILE = {
  businessName: 'Distribuidora Norte SA',
  description:
    'Mayorista de tecnología y electrónica con más de 10 años de experiencia en el mercado latinoamericano.',
  category: 'Tecnología y Electrónica',
  country: 'México',
  state: 'Nuevo León',
  whatsapp: '+52 81 1234 5678',
  instagram: 'https://instagram.com/distribuidoranorte',
  facebook: 'https://facebook.com/distribuidoranorte',
  website: 'https://distribuidoranorte.com',
  profilePhotoUri: null as string | null,
  carouselPhotos: ['', '', ''] as string[],
  catalogCarousels: [
    { title: 'Carrusel 1', images: 3 },
    { title: 'Carrusel 2', images: 2 },
    { title: 'Carrusel 3', images: 0 },
    { title: 'Carrusel 4', images: 1 },
    { title: 'Carrusel 5', images: 0 },
  ],
};

export const MOCK_METRICS = {
  profileClicksLastMonth: 20,
  whatsappClicksLastMonth: 10,
};

export const MOCK_SUBSCRIPTION = {
  expiresAt: new Date(2026, 4, 14),
  monthlyPriceMxn: 69,
};

export const MOCK_WHATSAPP = {
  subscription: '5215512345678',
  banners: '5215512345678',
};
