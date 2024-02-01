import "react-toastify/dist/ReactToastify.css";
import Home from "./Home";

export interface PositionError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

export interface WeatherProps {
  temperature: string;
  description: string;
  icon: string;
  humidity: string;
  wind: string;
  realFeel: string;
}

export interface HourlyForecastProps {
  time: string;
  temperature: string;
  description: string;
  icon: string;
}

export default Home;
