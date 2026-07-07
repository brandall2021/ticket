import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const data = [
  { asesor: "CORONEL, KAREN", turno: "Tarde", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8055", rol: "Team Leader" },
  { asesor: "VEGA, FRANCO", turno: "Tarde", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8031", rol: "Asesor" },
  { asesor: "SANCHEZ, LARA", turno: "Tarde", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8005", rol: "Asesor" },
  { asesor: "MARRE, ALEJO", turno: "Tarde", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8261", rol: "Asesor" },
  { asesor: "ARISMENDI, MICAELA", turno: "Tarde", campania: "ASOCIART", supervision: "Nazarena Lopez", interno: "8100", rol: "Asesor" },
  { asesor: "GALLO, GABRIELA", turno: "Tarde", campania: "EXPERTA ART-OMINT ART", supervision: "Nazarena Lopez", interno: "8295", rol: "Asesor" },
  { asesor: "GONZALEZ, DANA", turno: "Tarde", campania: "PREVENCION ART", supervision: "Nazarena Lopez", interno: "8042", rol: "Asesor" },
  { asesor: "ECHENIQUE, GABRIELA", turno: "Tarde", campania: "PREVENCION ART", supervision: "Nazarena Lopez", interno: "8229", rol: "Team Leader" },
  { asesor: "MAIDANA, DAVID", turno: "Tarde", campania: "MONI ONLINE-CREDITO ARGENTINO-CENTROCARD MT-FOTO MULTAS", supervision: "Nadia Ramirez", interno: "8064", rol: "Team Leader" },
  { asesor: "NUÑEZ, SOFIA", turno: "Tarde", campania: "PARQUE DE LA PAZ-POSTA-WENANCE-FOTO MULTAS", supervision: "Nadia Ramirez", interno: "8022", rol: "Asesor" },
  { asesor: "BESSONE, CYNTHIA", turno: "Tarde", campania: "CREDICUOTAS", supervision: "Melina Vega", interno: "8182", rol: "Asesor" },
  { asesor: "PAREDES, SOL", turno: "Tarde", campania: "SUPERCANAL-CRISTAL CASH", supervision: "Melina Vega", interno: "8211", rol: "Asesor" },
  { asesor: "ALVAREZ, VERONICA", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8109", rol: "Team Leader" },
  { asesor: "SEBALLOS, MILAGROS", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8191", rol: "Asesor" },
  { asesor: "SUAREZ, MARIANO", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8039", rol: "Asesor" },
  { asesor: "MOLINA, DIEGO", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8242", rol: "Asesor" },
  { asesor: "ROMANO, ERIC", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8028", rol: "Asesor" },
  { asesor: "ALVAREZ, VALENTINA", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8128", rol: "Asesor" },
  { asesor: "VILLARREAL, ERIKA", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8210", rol: "Asesor" },
  { asesor: "LOPEZ, LUCIANO", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8266", rol: "Asesor" },
  { asesor: "SANTILLAN, SAMUEL", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8048", rol: "Asesor" },
  { asesor: "LAZARTE, MAYLEN", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8029", rol: "Asesor" },
  { asesor: "PEREZ, LIHUEN", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8045", rol: "Asesor" },
  { asesor: "BARREIRO, LUIS", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8270", rol: "Asesor" },
  { asesor: "DIAB, MATIAS", turno: "Tarde", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8256", rol: "Asesor" },
  { asesor: "GARAY, BELEN", turno: "Tarde", campania: "EDESUR", supervision: "Juan Charcas", interno: "8155", rol: "Team Leader" },
  { asesor: "SORIA, JULIETA", turno: "Tarde", campania: "EDESUR", supervision: "Juan Charcas", interno: "8117", rol: "Asesor" },
  { asesor: "RISSO, HERMINIA", turno: "Tarde", campania: "AGUAS DE TUCUMAN-AGUAS DE CATAMARCA-AGUAS DE SANTIAGO-GASNOR-MUTUAL PROTECCION FLIAR", supervision: "Gustavo Herrera", interno: "8074", rol: "Team Leader" },
  { asesor: "OLEA, OCTAVIO", turno: "Tarde", campania: "AGUAS DE TUCUMAN-AGUAS DE CATAMARCA-AGUAS DE SANTIAGO-GASNOR-MUTUAL PROTECCION FLIAR", supervision: "Gustavo Herrera", interno: "8142", rol: "Asesor" },
  { asesor: "SALGUERO, NESTOR", turno: "Tarde", campania: "EFECTIVO SI", supervision: "Gustavo Herrera", interno: "8020", rol: "Asesor" },
  { asesor: "CORONEL, MARCOS", turno: "Tarde", campania: "CASTILLO 1era INSTANCIA-CASTILLO 2da INSTANCIA-CASTILLO 1era OPERACION", supervision: "Daniel Billone", interno: "8279", rol: "Asesor" },
  { asesor: "NUÑEZ, DANA", turno: "Tarde", campania: "CASTILLO MT", supervision: "Daniel Billone", interno: "8030", rol: "Asesor" },
  { asesor: "MEDINA, CAMILA", turno: "Tarde", campania: "CASTILLO RESIDUAL-CREDIN-CREDITOS DEL VALLE-ACUATRO-PACO GARCIA", supervision: "Daniel Billone", interno: "8241", rol: "Asesor" },
  { asesor: "GOMEZ, JIMENA", turno: "Tarde", campania: "CASTILLO RESIDUAL-CREDIN-CREDITOS DEL VALLE-ACUATRO-PACO GARCIA", supervision: "Daniel Billone", interno: "8021", rol: "Asesor" },
  { asesor: "MUÑOZ, FLORENCIA", turno: "Tarde", campania: "CASTILLO RESIDUAL-CREDIN-CREDITOS DEL VALLE-ACUATRO-PACO GARCIA", supervision: "Daniel Billone", interno: "8259", rol: "Asesor" },
  { asesor: "RODRIGUEZ, LUZ", turno: "Tarde", campania: "CREDIMAS", supervision: "Daniel Billone", interno: "8002", rol: "Team Leader" },
  { asesor: "GONZALEZ, MARIANA", turno: "Tarde", campania: "BANCO GALICIA", supervision: "Alejandra Faciano", interno: "8083", rol: "Asesor" },
  { asesor: "VALLEJO, AIDE", turno: "Tarde", campania: "BANCO GALICIA", supervision: "Alejandra Faciano", interno: "8024", rol: "Asesor" },
  { asesor: "SANCHEZ, LOURDES", turno: "Tarde", campania: "FINANCIE RAPIDO MT-FINANCIE RAPIDO-N&F PREJUDICIAL-GRAN COOPERATIVA PREJUDICIAL-N&F AVANZADA-GRAN COOPERATIVA AVANZADA-COOPERATIVA CUENCA-AMARGOT / CONFIO-CREDIFAX-COOPERATIVA CUENCA-", supervision: "Alejandra Faciano", interno: "8009", rol: "Asesor" },
  { asesor: "ESCOBAR, CAMILA", turno: "Tarde", campania: "LUQUIN-LUQUIN MT", supervision: "Alejandra Faciano", interno: "8043", rol: "Asesor" },
  { asesor: "VARELA, CONSTANZA", turno: "Mañana", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8019", rol: "Asesor" },
  { asesor: "DIAZ, GUILLERMO", turno: "Mañana", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8041", rol: "Asesor" },
  { asesor: "SOSA, CAMILA", turno: "Mañana", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8181", rol: "Team Leader" },
  { asesor: "JUAREZ, FLORENCIA", turno: "Mañana", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8200", rol: "Asesor" },
  { asesor: "BASTA, LEANDRO", turno: "Mañana", campania: "SANCOR SALUD", supervision: "Rocio Tena", interno: "8143", rol: "Asesor" },
  { asesor: "CORDOBA, YANINA", turno: "Mañana", campania: "EXPERTA ART-OMINT ART", supervision: "Nazarena Lopez", interno: "8240", rol: "Asesor" },
  { asesor: "REYNOSO, ANABEL YANINA", turno: "Mañana", campania: "PREVENCION ART", supervision: "Nazarena Lopez", interno: "8107", rol: "Asesor" },
  { asesor: "JABIT, CARLOS", turno: "Mañana", campania: "PREVENCION ART", supervision: "Nazarena Lopez", interno: "8224", rol: "Asesor" },
  { asesor: "RODRIGUEZ, JULIETA", turno: "Mañana", campania: "TARJETA DINAMICA-FINCRED-NIVEL SEGUROS", supervision: "Nazarena Lopez", interno: "8251", rol: "Asesor" },
  { asesor: "BRUNET, LEONARDO", turno: "Mañana", campania: "PARQUE DE LA PAZ-POSTA-WENANCE-FOTO MULTAS", supervision: "Nadia Ramirez", interno: "8201", rol: "Asesor" },
  { asesor: "ARDILES, SOFIA", turno: "Mañana", campania: "CREDICUOTAS", supervision: "Melina Vega", interno: "8174", rol: "Asesor" },
  { asesor: "RODRIGUEZ, FERNANDO", turno: "Mañana", campania: "SUPERCANAL-CRISTAL CASH", supervision: "Melina Vega", interno: "8071", rol: "Asesor" },
  { asesor: "ESTRADE, CAMILA", turno: "Mañana", campania: "SUPERCANAL-CRISTAL CASH", supervision: "Melina Vega", interno: "8206", rol: "Team Leader" },
  { asesor: "GUZMAN, ALVARO", turno: "Mañana", campania: "CROSS MELI COLOMBIA-CROSS MELI URUGUAY-MERCADO CREDITO CONSUMER DIGITAL-INSURTECH MELI", supervision: "Lucas Medina", interno: "8127", rol: "Asesor" },
  { asesor: "ROJAS, EVER", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8228", rol: "Asesor" },
  { asesor: "CHOCOBAR, MARIA JOSE", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8220", rol: "Asesor" },
  { asesor: "REINOSO, RAFAEL", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8250", rol: "Asesor" },
  { asesor: "ESPINOSA, LUCIANA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8208", rol: "Team Leader" },
  { asesor: "CALDERA, CAMILA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA-<360", supervision: "Lucas Medina", interno: "8032", rol: "Asesor" },
  { asesor: "MALLO, EUGENIA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8025", rol: "Asesor" },
  { asesor: "HERRERA, FLORENCIA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8233", rol: "Asesor" },
  { asesor: "MACIEL, PATRICIA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8023", rol: "Asesor" },
  { asesor: "RODRIGUEZ, MARIANA", turno: "Mañana", campania: "MERCADO CREDITO CONSUMER TARDIA->360", supervision: "Lucas Medina", interno: "8137", rol: "Asesor" },
  { asesor: "CASTILLO, AYELEN", turno: "Mañana", campania: "EDESUR", supervision: "Juan Charcas", interno: "8205", rol: "Asesor" },
  { asesor: "PALLARES, BELEN", turno: "Mañana", campania: "EDESUR", supervision: "Juan Charcas", interno: "8103", rol: "Asesor" },
  { asesor: "CHAVEZ, SOFIA", turno: "Mañana", campania: "AGUAS DE TUCUMAN-AGUAS DE CATAMARCA-AGUAS DE SANTIAGO-GASNOR-MUTUAL PROTECCION FLIAR", supervision: "Gustavo Herrera", interno: "8260", rol: "Asesor" },
  { asesor: "DAGE, LEILA", turno: "Mañana", campania: "AGUAS DE TUCUMAN-AGUAS DE CATAMARCA-AGUAS DE SANTIAGO-GASNOR-MUTUAL PROTECCION FLIAR", supervision: "Gustavo Herrera", interno: "8003", rol: "Asesor" },
  { asesor: "ALBARRACIN, REBECA", turno: "Mañana", campania: "EFECTIVO SI", supervision: "Gustavo Herrera", interno: "8126", rol: "Asesor" },
  { asesor: "CIVILI, PIA", turno: "Mañana", campania: "CASTILLO 1era INSTANCIA-CASTILLO 2da INSTANCIA-CASTILLO 1era OPERACION", supervision: "Daniel Billone", interno: "8095", rol: "Team Leader" },
  { asesor: "MONTENEGRO, ABIGAIL", turno: "Mañana", campania: "CASTILLO MT", supervision: "Daniel Billone", interno: "8008", rol: "Asesor" },
  { asesor: "LOPEZ, NOEMI", turno: "Mañana", campania: "CASTILLO RESIDUAL-CREDIN-CREDITOS DEL VALLE-ACUATRO-PACO GARCIA", supervision: "Daniel Billone", interno: "8268", rol: "Asesor" },
  { asesor: "CAPRIOGLIO, LUCIA", turno: "Mañana", campania: "CREDIMAS", supervision: "Daniel Billone", interno: "8247", rol: "Asesor" },
  { asesor: "RIOS, VERONICA", turno: "Mañana", campania: "BANCO GALICIA", supervision: "Alejandra Faciano", interno: "8091", rol: "Team Leader" },
  { asesor: "JUAREZ, NATALI", turno: "Mañana", campania: "BANCO GALICIA", supervision: "Alejandra Faciano", interno: "8284", rol: "Asesor" },
  { asesor: "ROBLES, BELEN", turno: "Mañana", campania: "FINANCIE RAPIDO MT-FINANCIE RAPIDO-N&F PREJUDICIAL-GRAN COOPERATIVA PREJUDICIAL-N&F AVANZADA-GRAN COOPERATIVA AVANZADA-COOPERATIVA CUENCA-AMARGOT / CONFIO-CREDIFAX-COOPERATIVA CUENCA-", supervision: "Alejandra Faciano", interno: "8014", rol: "Asesor" },
  { asesor: "PELLEGRI, NICOLE", turno: "Mañana", campania: "LUQUIN-LUQUIN MT", supervision: "Alejandra Faciano", interno: "8026", rol: "Asesor" },
  { asesor: "GOMEZ, ELIANA", turno: "Mañana", campania: "LICENCIA-", supervision: "", interno: "8011", rol: "Asesor" },
]

async function main() {
  console.log("Limpiando tabla Interno...")
  await prisma.interno.deleteMany()
  console.log(`Insertando ${data.length} registros...`)
  for (const row of data) {
    await prisma.interno.create({ data: row })
  }
  console.log("Seed completado!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
