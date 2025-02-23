class WeatherApp {
    constructor() {
        // Store the OpenWeather API key
        this.API_KEY = '6bb0346514bfd7a2b19a98648a8e59b5';
        
        // Get DOM elements that are used in the app
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.weatherBox = document.querySelector('.weather-box');
        this.loadingBox = document.querySelector('.loading-box');
        this.errorBox = document.querySelector('.error-box');
        this.suggestionsBox = document.getElementById('suggestions');
        this.unitToggleBtn = document.getElementById('unit-toggle');
        
        // Weather data elements
        this.city = document.getElementById('city');
        this.temp = document.getElementById('temp');
        this.condition = document.getElementById('condition');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('wind-speed');
        this.weatherIcon = document.getElementById('weather-icon');
        this.updateTime = document.getElementById('update-time');

        // Default city and other initializations
        this.currentCity = 'Ishwardi';
        this.refreshInterval = 30000; // 30 seconds auto-refresh interval
        this.refreshTimer = null;
        this.searchTimeout = null;
        this.currentTempCelsius = 0;
        this.isCelsius = true;

        // Initialize the app
        this.init();
    }

    init() {
        // Event listener for the search button click
        this.searchBtn.addEventListener('click', () => {
            this.currentCity = this.searchInput.value.trim(); // Update the city based on input
            this.getWeather(); // Fetch weather data for the new city
        });

        // Event listener for the Enter key press in the search input
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentCity = this.searchInput.value.trim();
                this.getWeather(); // Fetch weather data for the new city
                this.hideSuggestions(); // Hide suggestions after search
            }
        });

        // Event listener for input in the search box (to get city suggestions)
        this.searchInput.addEventListener('input', () => {
            this.debouncedGetSuggestions(); // Fetch suggestions with a delay
        });

        // Toggle temperature unit (Celsius/Fahrenheit)
        this.unitToggleBtn.addEventListener('click', () => {
            this.toggleTemperatureUnit();
        });

        // Event listener to close suggestions if clicked outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.suggestionsBox.contains(e.target)) {
                this.hideSuggestions(); // Hide suggestions if clicked outside
            }
        });

        // Load weather data for default city (Ishwardi) and start auto-refresh
        this.getWeather('Ishwardi');
        this.startAutoRefresh();
    }

    // Convert Celsius to Fahrenheit
    celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    // Update the displayed temperature and unit toggle button
    updateTemperatureDisplay() {
        const temperature = this.isCelsius ? 
            this.currentTempCelsius : 
            this.celsiusToFahrenheit(this.currentTempCelsius);

        this.temp.textContent = Math.round(temperature); // Display the temperature
        this.unitToggleBtn.textContent = this.isCelsius ? '°C' : '°F'; // Toggle unit label
    }

    // Toggle between Celsius and Fahrenheit
    toggleTemperatureUnit() {
        this.isCelsius = !this.isCelsius;
        this.updateTemperatureDisplay();
    }

    // Delay function for fetching city suggestions (debouncing)
    debouncedGetSuggestions() {
        clearTimeout(this.searchTimeout); // Clear the previous timeout
        this.searchTimeout = setTimeout(() => {
            const query = this.searchInput.value.trim();
            if (query.length >= 3) {
                this.getCitySuggestions(query); // Fetch suggestions if query length >= 3
            } else {
                this.hideSuggestions(); // Hide suggestions if query length is less than 3
            }
        }, 300); // Debounced delay of 300ms
    }

    // Fetch city suggestions from the OpenWeather API
    async getCitySuggestions(query) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }

            const cities = await response.json();
            this.displaySuggestions(cities); // Display the suggestions
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.hideSuggestions(); // Hide suggestions if there's an error
        }
    }

    // Display city suggestions in the suggestions box
    displaySuggestions(cities) {
        if (!cities.length) {
            this.hideSuggestions();
            return;
        }

        // Clear the previous suggestions
        this.suggestionsBox.innerHTML = '';
        cities.forEach(city => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`;

            // When a suggestion is clicked, set it as the current city and fetch weather
            div.addEventListener('click', () => {
                this.searchInput.value = city.name;
                this.currentCity = city.name;
                this.getWeather(); // Fetch weather data for the selected city
                this.hideSuggestions(); // Hide suggestions after selection
            });

            // Append the suggestion to the suggestions box
            this.suggestionsBox.appendChild(div);
        });

        this.suggestionsBox.classList.remove('hidden'); // Show the suggestions box
    }

    // Hide the suggestions box
    hideSuggestions() {
        this.suggestionsBox.classList.add('hidden');
        this.suggestionsBox.innerHTML = ''; // Clear the suggestions
    }

    // Start auto-refresh to get weather data every 5 minutes
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer); // Clear any existing timers
        }

        this.refreshTimer = setInterval(() => {
            this.getWeather(this.currentCity); // Fetch weather data for the current city
        }, this.refreshInterval);
    }

    // Show the loading spinner
    showLoading() {
        this.weatherBox.classList.add('hidden');
        this.errorBox.classList.add('hidden');
        this.loadingBox.classList.remove('hidden');
    }

    // Show an error message
    showError(message) {
        this.weatherBox.classList.add('hidden');
        this.loadingBox.classList.add('hidden');
        this.errorBox.classList.remove('hidden');
        document.getElementById('error-message').textContent = message; // Display the error message
    }

    // Show the weather information
    showWeather() {
        this.loadingBox.classList.add('hidden');
        this.errorBox.classList.add('hidden');
        this.weatherBox.classList.remove('hidden');
    }

    // Update the last update time
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString(); // Get current time
        const dateString = now.toLocaleDateString(); // Get current date
        this.updateTime.textContent = `${dateString} ${timeString}`; // Display the date and time
    }

    // Fetch the weather data for a specific city
    async getWeather(defaultCity = '') {
        const city = defaultCity || this.currentCity;

        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        this.showLoading(); // Show loading state

        try {
            // Fetch weather data from the OpenWeather API
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${this.API_KEY}`
            );

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'City not found' : 'Failed to fetch weather data');
            }

            const data = await response.json(); // Parse the response JSON

            // Store and display temperature in Celsius
            this.currentTempCelsius = data.main.temp;
            this.updateTemperatureDisplay();

            // Update weather data on the page
            this.city.textContent = data.name;
            this.condition.textContent = data.weather[0].description
                .split(' ') // Capitalize the weather description
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            this.humidity.textContent = data.main.humidity;
            this.windSpeed.textContent = Math.round(data.wind.speed * 3.6); // Convert wind speed from m/s to km/h
            this.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

            this.updateLastUpdateTime(); // Update the last updated time
            this.showWeather(); // Show the weather information

            // Store the current city for auto-refresh
            this.currentCity = data.name;
        } catch (error) {
            this.showError(error.message); // Show error if there’s an issue
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
