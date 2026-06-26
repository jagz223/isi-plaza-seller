export type TermsTextPart = {
  text: string;
  bold?: boolean;
};

export type TermsBlock =
  | { type: 'document-title'; text: string }
  | { type: 'section-title'; text: string }
  | { type: 'paragraph'; parts: TermsTextPart[] }
  | { type: 'bullet-list'; items: TermsTextPart[][] };

export const TERMS_AND_CONDITIONS_BLOCKS: TermsBlock[] = [
  {
    type: 'document-title',
    text: 'Términos y Condiciones de Uso de la Plataforma',
  },
  { type: 'section-title', text: '1. Aceptación de los Términos' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '1.1 Al acceder, registrarse o utilizar la plataforma, tanto los usuarios como los vendedores aceptan los presentes Términos y Condiciones.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '1.2 El uso de la plataforma está destinado exclusivamente para pacientes y médicos mayores de edad que residan en México.',
      },
    ],
  },
  { type: 'section-title', text: '2. Responsabilidad Limitada' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '2.1 La plataforma actúa únicamente como un intermediario entre vendedores y compradores. No garantizamos la calidad, autenticidad, disponibilidad ni entrega de los productos anunciados por los vendedores.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '2.2 No somos responsables del mal uso de la plataforma por parte de los vendedores ni de los usuarios, incluidos, entre otros:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Publicación de información falsa o engañosa.' }],
      [{ text: 'Negativas a cumplir con pedidos o términos acordados.' }],
      [{ text: 'Disputas entre compradores y vendedores.' }],
    ],
  },
  { type: 'section-title', text: '3. Obligaciones del Usuario y del Vendedor' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '3.1 Los usuarios se comprometen a proporcionar información veraz y a utilizar la plataforma de manera ética y legal.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '3.2 Los vendedores deben garantizar que los productos ofrecidos cumplen con las leyes y regulaciones aplicables en México.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '3.3 La plataforma se reserva el derecho de suspender cuentas por incumplimiento de estos términos.',
      },
    ],
  },
  { type: 'section-title', text: '4. Exención de Responsabilidad' },
  {
    type: 'paragraph',
    parts: [{ text: '4.1 En ningún caso la plataforma será responsable por:' }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Daños indirectos, incidentales o consecuentes derivados del uso de la plataforma.' }],
      [{ text: 'Pérdidas económicas relacionadas con disputas entre compradores y vendedores.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '4.2 El usuario es responsable de verificar la legitimidad y confiabilidad de los vendedores.',
      },
    ],
  },
  { type: 'section-title', text: '5. Propiedad Intelectual' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '5.1 Todo el contenido de la plataforma, incluidos logotipos, diseños y textos, es propiedad exclusiva de la empresa. Queda estrictamente prohibido reproducir, modificar o distribuir dicho contenido sin autorización previa.',
      },
    ],
  },
  { type: 'section-title', text: '6. Privacidad y Protección de Datos' },
  {
    type: 'paragraph',
    parts: [
      { text: '6.1 Respetamos la privacidad de los usuarios y cumplimos con la ' },
      {
        text: 'Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)',
        bold: true,
      },
      { text: ' en México.' },
    ],
  },
  {
    type: 'paragraph',
    parts: [{ text: '6.2 Los datos personales proporcionados se utilizarán exclusivamente para:' }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Mejorar la experiencia en la plataforma.' }],
      [{ text: 'Gestionar transacciones entre usuarios y vendedores.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: '6.3 Bajo ninguna circunstancia compartiremos datos personales con terceros sin el consentimiento expreso del usuario, salvo por requerimiento legal.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [{ text: '6.4 Los usuarios tienen derecho a:' }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales.' }],
      [{ text: 'Solicitar la eliminación de sus datos mediante un correo a nuestro equipo de soporte.' }],
    ],
  },
  { type: 'section-title', text: '7. Jurisdicción' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '7.1 Cualquier conflicto derivado del uso de la plataforma se resolverá bajo las leyes aplicables de México, en los tribunales correspondientes al domicilio de la empresa.',
      },
    ],
  },
  { type: 'section-title', text: '8. Modificaciones' },
  {
    type: 'paragraph',
    parts: [
      {
        text: '8.1 La plataforma se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones se notificarán a los usuarios a través de la app o correo electrónico.',
      },
    ],
  },
  { type: 'section-title', text: '9. Aviso de Privacidad' },
  {
    type: 'paragraph',
    parts: [{ text: 'Finalidades del Tratamiento de Datos:', bold: true }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Recopilación de información para fines de identificación, contacto y transacciones.' }],
      [{ text: 'Prevención de fraudes y resolución de disputas.' }],
      [{ text: 'Envío de comunicaciones promocionales, siempre con consentimiento previo.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [{ text: 'Protección:', bold: true }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Utilizamos medidas técnicas y organizativas para garantizar la seguridad de los datos personales.' }],
      [{ text: 'En caso de vulneración, notificaremos a los usuarios afectados en el menor tiempo posible.' }],
    ],
  },
  { type: 'document-title', text: 'Aviso de Privacidad' },
  { type: 'section-title', text: 'Identidad y Domicilio del Responsable' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'La presente plataforma, operada por [Nombre de la empresa], con domicilio en [Dirección completa], es responsable del tratamiento de sus datos personales en términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
      },
    ],
  },
  { type: 'section-title', text: 'Finalidades del Tratamiento de Datos' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Sus datos personales serán utilizados para las siguientes finalidades principales:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Proveer servicios', bold: true }, { text: ' ofrecidos a través de la plataforma.' }],
      [{ text: 'Gestionar transacciones', bold: true }, { text: ' entre compradores y vendedores.' }],
      [{ text: 'Cumplir con obligaciones legales y contractuales.', bold: true }],
      [{ text: 'Prevenir fraudes', bold: true }, { text: ' y garantizar la seguridad de las operaciones.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [{ text: 'De manera adicional, podremos utilizar su información para:' }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Enviar promociones y publicidad (siempre con su consentimiento previo).' }],
      [{ text: 'Realizar encuestas de satisfacción y análisis estadísticos.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Usted tiene el derecho de oponerse al tratamiento de sus datos para estas finalidades secundarias.',
      },
    ],
  },
  { type: 'section-title', text: 'Datos Recabados' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Para las finalidades descritas, se podrán recabar los siguientes datos personales:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [
        { text: 'Datos de identificación:', bold: true },
        { text: ' Nombre, apellidos, dirección, correo electrónico, teléfono.' },
      ],
      [
        { text: 'Datos financieros:', bold: true },
        { text: ' Información bancaria o de pago, únicamente para procesar transacciones.' },
      ],
      [
        { text: 'Datos de uso de la plataforma:', bold: true },
        { text: ' Actividad y transacciones realizadas.' },
      ],
    ],
  },
  {
    type: 'paragraph',
    parts: [
      { text: 'Datos sensibles:', bold: true },
      {
        text: ' En caso de que se recopilen, se tratarán con estricta confidencialidad y solo con su consentimiento expreso.',
      },
    ],
  },
  { type: 'section-title', text: 'Transferencia de Datos' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Sus datos personales no serán compartidos con terceros sin su consentimiento, salvo en los siguientes casos:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Autoridades competentes, por requerimiento legal.' }],
      [
        {
          text: 'Terceros necesarios para procesar pagos o gestionar transacciones, siempre bajo estrictos acuerdos de confidencialidad.',
        },
      ],
    ],
  },
  { type: 'section-title', text: 'Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)' },
  {
    type: 'paragraph',
    parts: [{ text: 'Usted tiene derecho a:' }],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Acceder', bold: true }, { text: ' a sus datos personales en nuestro poder.' }],
      [{ text: 'Rectificar', bold: true }, { text: ' cualquier información inexacta o incompleta.' }],
      [
        { text: 'Solicitar la cancelación', bold: true },
        { text: ' de sus datos cuando considere que no son necesarios para las finalidades mencionadas.' },
      ],
      [{ text: 'Oponerse', bold: true }, { text: ' al tratamiento de sus datos en casos específicos.' }],
    ],
  },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Para ejercer estos derechos, envíe una solicitud al correo electrónico: [correo@empresa.com]. Su solicitud deberá incluir:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Su nombre completo.' }],
      [{ text: 'Una copia de su identificación oficial.' }],
      [{ text: 'Descripción clara del derecho que desea ejercer.' }],
    ],
  },
  { type: 'section-title', text: 'Medidas de Seguridad' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Para proteger sus datos personales, implementamos medidas de seguridad administrativas, técnicas y físicas, que incluyen:',
      },
    ],
  },
  {
    type: 'bullet-list',
    items: [
      [{ text: 'Encriptación de datos sensibles.' }],
      [{ text: 'Acceso restringido a información confidencial.' }],
      [{ text: 'Políticas internas de protección de datos.' }],
    ],
  },
  { type: 'section-title', text: 'Cambios al Aviso de Privacidad' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Nos reservamos el derecho de realizar modificaciones a este Aviso de Privacidad. Cualquier cambio se notificará a través de la plataforma o por correo electrónico.',
      },
    ],
  },
  { type: 'section-title', text: 'Consentimiento Expreso' },
  {
    type: 'paragraph',
    parts: [
      {
        text: 'Al registrarse y utilizar nuestra plataforma, usted consiente el tratamiento de sus datos personales conforme a este Aviso de Privacidad.',
      },
    ],
  },
  {
    type: 'paragraph',
    parts: [
      { text: 'Fecha de última actualización:', bold: true },
      { text: ' [23 de diciembre del 2024].' },
    ],
  },
];
