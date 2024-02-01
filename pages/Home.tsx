import React, { useState, useEffect } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTint, faWind, faThermometer } from "@fortawesome/free-solid-svg-icons";
import { FaSearch } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PositionError } from ".";

import "tailwindcss/tailwind.css";

interface WeatherProps {
  temperature: string;
  description: string;
  icon: string;
  humidity: string;
  wind: string;
  realFeel: string;
}

interface HourlyForecastProps {
  time: string;
  temperature: string;
  description: string;
  icon: string;
}

interface HourlyForecastItem {
  dt: number;
  main: {
    temp: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

interface FiveDayForecastItem {
  dt: number;
  main: {
    temp: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

const OPEN_WEATHER_API_KEY = "1efae1ec1f3b9fb7f0f8520ee6e2801c";

const Home: React.FC = () => {
  const [cityName, setCityName] = useState<string>("");
  const [currentWeather, setCurrentWeather] = useState<WeatherProps | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastProps[] | null>(null);
  const [fiveDayForecast, setFiveDayForecast] = useState<HourlyForecastProps[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await fetchWeatherAndLocationData(latitude, longitude);
              await fetchHourlyForecastData(latitude, longitude);
              await fetch5DayForecastData("");
            },
            (error) => {
              if (typeof error === 'object' && 'code' in error) {
                handleLocationError(error as PositionError);
              } else {
                handleLocationError(undefined);
              }
            }
          );
        }
      } catch (error) {
        handleLocationError(undefined);
      }
    };

    fetchData();
  }, []);

  const handleLocationError = (error: PositionError | undefined) => {
    if (error) {
      console.error("Error getting location:", error);
      setLoading(false);

      toast.error("Location not found. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
      });
    }
  };

  async function fetchWeatherAndLocationData(latitude: number, longitude: number) {
    try {
      const apiKey = "1efae1ec1f3b9fb7f0f8520ee6e2801c";
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
      );

      const locationResponse = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
      );

      const { main, weather, wind } = weatherResponse.data;
      const currentWeatherData: WeatherProps = {
        temperature: String(main.temp),
        description: weather[0].description,
        icon: weather[0].icon,
        humidity: String(main.humidity),
        wind: String(wind.speed),
        realFeel: String(main.feels_like),
      };

      const cityName = locationResponse.data[0]?.name || "Unknown";
      setCurrentWeather(currentWeatherData);
      setCurrentLocation(cityName);
    } catch (error) {
      console.error("Error fetching weather and location data:", error);
      throw new Error("Error fetching weather and location data");
    } finally {
      setLoading(false);
    }
  }

  const fetchHourlyForecastData = async (latitude: number, longitude: number) => {
    try {
      const hourlyForecastResponse = await axios.get<{ list: HourlyForecastItem[] }>(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );

      const currentDate = new Date();
      const next24Hours = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

      const hourlyForecastData = hourlyForecastResponse.data.list
        .filter((item) => {
          const itemDate = new Date(item.dt * 1000);
          return itemDate.getTime() <= next24Hours.getTime();
        })
        .map((item) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(),
          temperature: String(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        }));

      const stepSize = Math.max(1, Math.floor(hourlyForecastData.length / 5));
      const displayedHourlyForecast = hourlyForecastData.filter((_, index) => index % stepSize === 0).slice(0, 5);

      setHourlyForecast(displayedHourlyForecast);
    } catch (error) {
      console.error("Error fetching hourly forecast data:", error);
    }
  };

  const fetch5DayForecastData = async (city: string) => {
    try {
      if (!city.trim()) {
        console.error("City name is empty");
        return;
      }

      const apiKey = "1efae1ec1f3b9fb7f0f8520ee6e2801c";
      const findCityResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/find?q=${city}&appid=${apiKey}&units=metric`
      );

      if (findCityResponse.data.list && findCityResponse.data.list.length > 0) {
        const { lat, lon } = findCityResponse.data.list[0].coord;
        const fiveDayForecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        const fiveDayForecastData = fiveDayForecastResponse.data.list
          .filter((item: any, index: number) => index % 8 === 0)
          .map((item: any) => ({
            time: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
            temperature: String(item.main.temp),
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          }));

        setFiveDayForecast(fiveDayForecastData);
      } else {
        console.error(`City not found: ${city}`);
        toast.error(`City not found: ${city}. Please enter a valid city name.`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
        });
      }
    } catch (error) {
      console.error("Error fetching 5-day forecast data:", error);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherAndLocationData(latitude, longitude);
            await fetchHourlyForecastData(latitude, longitude);
            await fetch5DayForecastData("");
          },
          (error) => {
            if (typeof error === 'object' && 'code' in error) {
              handleLocationError(error as PositionError);
            } else {
              handleLocationError(undefined);
            }
          }
        );
      }
    } catch (error) {
      handleLocationError(undefined);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCityName(event.target.value);
  };

  const handleSearch = () => {
    if (cityName.trim() !== "") {
      fetchWeatherAndLocationDataByCity(cityName);
    }
  };

  const fetchWeatherAndLocationDataByCity = async (city: string) => {
    try {
      const apiKey = "1efae1ec1f3b9fb7f0f8520ee6e2801c";
      const findCityResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/find?q=${city}&appid=${apiKey}&units=metric`
      );

      if (findCityResponse.data.list && findCityResponse.data.list.length > 0) {
        const { lat, lon } = findCityResponse.data.list[0].coord;
        await fetchWeatherAndLocationData(lat, lon);
        await fetchHourlyForecastData(lat, lon);
        await fetch5DayForecastData(city);
      } else {
        toast.error(`Not Found: ${city}. Please enter a valid city name.`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      fetch5DayForecastData(currentLocation);
    }
  }, [currentLocation]);

  return (
    <div className="bg-cover bg-gradient-to-r from-gray-700 to-gray-300 min-h-screen p-6">
      <div className="bg-black/25 mx-auto max-w-3xl mt-3 py-10 px-4 md:px-10 lg:px-20 xl:px-28 p-8 rounded-lg shadow-md">

        {loading ? (
          <div className="text-white text-lg">
            <Skeleton height={30} width={200} />
            <Skeleton height={200} />
            <Skeleton height={30} width={150} />
            <Skeleton height={30} width={200} />
            <Skeleton height={200} />
          </div>
        ) : (
          <div className="flex flex-col md:first-letter:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
              <input
                type="text"
                value={cityName}
                onChange={handleInputChange}
                placeholder="Enter city name"
                className="w-full md:w-48 lg:w-64 bg-transparent border-b-2 outline-none cursor-pointer text-white"
              />
              <button onClick={handleSearch} className="md:ml-2 mt-2 md:mt-0">
                <FaSearch />
              </button>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-2">
              <p>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())} | {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
              </p>
            </div>

            {currentLocation && (
              <div className="mt-3 text-3xl text-md flex flex-col md:first-letter:flex-row justify-between items-center ">
                <p>{currentLocation}</p>
              </div>
            )}

            {currentWeather && (
              <div className="mt-2 flex flex-col md:first-letter:flex-row justify-between items-center md:items-start">
                <div>
                  <p className="text-lg text-md font-bold">{currentWeather.temperature}°C   |   {currentWeather.description}</p>
                  <img
                    className="flex md:first-letter:flex-row justify-between items-center"
                    src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`}
                    alt={currentWeather.description}
                  />
                </div>

                <div className="text-sm font-semibold text-slate-200 mt-2">
                  <p>
                    <FontAwesomeIcon icon={faTint} className="mr-1 text-black" />
                    Humidity: {currentWeather.humidity}%
                    <FontAwesomeIcon icon={faWind} className="ml-4 mr-1 text-black" />
                    Wind: {currentWeather.wind} m/s
                    <FontAwesomeIcon icon={faThermometer} className="mr-1 ml-4 text-black" />
                    Real Feel: {currentWeather.realFeel}°C
                  </p>
                </div>
              </div>
            )}

            {hourlyForecast && (
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">Hourly Forecast</h3>
                <hr className="my-4 border-t-1 border-gray-500" />
                <div className="flex md:first-letter:flex-row justify-between items-center">
                  {hourlyForecast.slice(0, 5).map((hourData, index) => (
                    <div key={index} className="flex-shrink-0 mr-5">
                      <p className="text-sm">{hourData.time}</p>
                      <p className="text-lg font-bold">{hourData.temperature}°C</p>
                      <p className="text-sm">{hourData.description}</p>
                      <img
                        src={`https://openweathermap.org/img/wn/${hourData.icon}.png`}
                        alt={hourData.description}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fiveDayForecast && (
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">Daily Forecast</h3>
                <hr className="my-4 border-t-1 border-gray-500" />
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
                  {fiveDayForecast.map((dayData, index) => (
                    <div key={index} className="flex-shrink-0 mr-5">
                      <p className="text-sm">{dayData.time}</p>
                      <p className="text-lg font-bold">{dayData.temperature}°C</p>
                      <p className="text-sm">{dayData.description}</p>
                      <img
                        src={`https://openweathermap.org/img/wn/${dayData.icon}.png`}
                        alt={dayData.description}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={fetchCurrentLocation} className="mt-4">
              <BiCurrentLocation />
            </button>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default Home;
