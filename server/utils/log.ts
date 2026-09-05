import { createConsola } from 'consola'

export const log = createConsola({ level: config.debug ? 4 : 3 }).withTag('removearr')
