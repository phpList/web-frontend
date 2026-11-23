// Installs vue-i18n with the real English catalogue for every mounted component,
// so specs can keep asserting on the English text users see.
import { config } from '@vue/test-utils'
import { createAppI18n } from '../../../../../assets/vue/i18n'
import { loadXliffMessages } from './xliff'

config.global.plugins = [
    ...(config.global.plugins || []),
    createAppI18n({ locale: 'en', messages: loadXliffMessages('en') }),
]