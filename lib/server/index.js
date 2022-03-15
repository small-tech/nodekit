import developmentServer from './development'
import productionServer from './production'

export default function server () {
  return process.env.PRODUCTION ? productionServer : developmentServer
}

