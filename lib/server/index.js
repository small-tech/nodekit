import DevelopmentServer from './DevelopmentServer'
import ProductionServer from './ProductionServer'

export default function server () {
  return process.env.PRODUCTION ? ProductionServer : DevelopmentServer
}

