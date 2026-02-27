//create initial variables from HTML
let input = document.querySelector("#user-input");
var searchBtn = document.querySelector("#search");
var searchHist = document.querySelector("#search-history");
var cityCurrent = document.querySelector("#city-current");
var forecast = document.querySelector("#five-day-forecast");

//create an empty array for search history
var searchHistory = []

//create variable for API key
var APIKey = "f299a5114970c339b29accfb86e8b629"

//Create a function for future weather
function futureWeather (data) {
    console.log(data.list)
    
    //create for loop that picks 5 indexes off the array at 24 hr intervals
    for (var i = 2; i < data.list.length; i += 8) {
        //create a div to contain individual day forecast
        var card = document.createElement("div");
        forecast.appendChild(card)
        card.classList.add('card')
        //create variables for individual elements within the card
        var dateEl = document.createElement("h3")
        card.appendChild(dateEl);
        dateEl.innerHTML = data.list[i].dt_txt
        var tempEl = document.createElement("p")
        card.appendChild(tempEl)
        tempEl.innerHTML = "Temperature in Kelvin: " + data.list[i].main.temp
        var humidityEl = document.createElement("p")
        card.appendChild(humidityEl)
        humidityEl.innerHTML = "Humidity: " + data.list[i].main.humidity + "%"
        var windSpeedEl = document.createElement("p")
        card.appendChild(windSpeedEl)
        windSpeedEl.innerHTML = "Wind speed: " + data.list[i].wind.speed + "mph"
        var iconEl = document.createElement("img")
        iconEl.setAttribute("src", "http://openweathermap.org/img/wn/" + data.list[i].weather[0].icon + "@2x.png")
        card.appendChild(iconEl)
    }
}

//Create function that checks local storage for search history on page load
function getSearchHistory () {
    //check to see if there's local storage
    if (!localStorage.getItem("search-history")) {
        console.log("herpmerp")
    } else {
        searchHistory = JSON.parse(localStorage.getItem("search-history"))
        console.log(searchHistory)
    }
}

//create function that goes in the search button eventlistener
function searchFunc (event) {
    event.preventDefault()
    input = input.value
    //create variable for weather api url
    var coordinatesURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + input + "&cnt=40&appid=" + APIKey

    //input goes to search history

    //current and future weather conditions are presented 
    fetch(coordinatesURL)
    .then (function(response) {
        if (response.ok) {
            response.json()
            .then (function(data) {
                console.log(data)

                //add city name
                var cityName = document.createElement("h2");
                cityName.innerHTML = data.city.name
                cityCurrent.appendChild(cityName);

                //commit city to local storage
                var i=0; i<searchHistory.length; i++
                if (searchHistory[i] !== input) {
                    searchHistory.push(input)
                    var history = document.createElement("button");
                    history.innerText = input
                    searchHist.appendChild(history)
                }

                //push search history array into local storage
                localStorage.setItem("search-history", JSON.stringify(searchHistory))

                //add date
                var date = 
                document.createElement("h3");
                cityCurrent.appendChild(date);
                date.innerHTML = data.list[0].dt_txt

                //add icon representation of weather conditions
                var icon = document.createElement("img");
                icon.setAttribute("src", "http://openweathermap.org/img/wn/" + data.list[0].weather[0].icon + "@2x.png")
                cityCurrent.appendChild(icon)

                //add temperature
                var temp = document.createElement("p")
                cityCurrent.appendChild(temp)
                temp.innerHTML = "Temperature in Kelvin: " + data.list[0].main.temp

                //add humidity
                var humidity = document.createElement("p")
                cityCurrent.appendChild(humidity)
                humidity.innerHTML = "Humidity: " + data.list[0].main.humidity + "%"

                //add wind speed
                var windSpeed = document.createElement("p")
                cityCurrent.appendChild(windSpeed)
                windSpeed.innerHTML = "Wind speed: " + data.list[0].wind.speed + "mph"
                futureWeather(data)
            })
        }
    }
)}

//make search button search
searchBtn.addEventListener("click", searchFunc);
//get search history from local storage
getSearchHistory()