class WeatherManager {

    constructor() {
        self.storageManager = new StorageManager();
        self.httpClient = new HttpClient();
        self.defaultPoint = new Point(36.114647, -115.172813);
        self.localWeather = document.getElementById("localWeather");
        self.favoritesCities = document.getElementById("favorites");
        self._this = this;
    }

    init() {
        this.updateLocalWeather();
        this.initStoreWeather();
        this.initUpdateButtonListener();
        this.initAutocompleteInput();
        this.initAddButton();
    }

    initAddButton() {
        document.getElementById("addCity").addEventListener('click', function () {
            const datalist = document.getElementById("cities");
            const input = document.getElementsByClassName("favorites-input")[0];
            for (const el of datalist.children) {
                if (el.value === input.value) {
                    const position = new Point(
                        el.getAttribute("lat"),
                        el.getAttribute("lng")
                    );
                    if (position.lat && position.lng) {
                        self._this.addFavoriteCity(position, function (point) {
                            self.storageManager.savePoint(point);
                            input.value = "";
                        });
                    }
                    break;
                }
            }
        });
    }

    initStoreWeather() {
        self.storageManager.loadPoints().forEach(function (point) {
            self._this.addFavoriteCity(point);
        });
    }

    addFavoriteCity(point, onSuccess = () => {}) {
        const card = document.createElement("li");
        card.classList.add("favorites-item");
        card.appendChild(WeatherManager.getTemplate("loader"));
        self.favoritesCities.appendChild(card);
        self.httpClient.getWeather(point,
            function (weather) {
                onSuccess(weather.point);
                const node = self._this.getFavoriteCityCard(weather);
                card.appendChild(node);
                card.querySelector(".loader-wrapper").remove();
            },
            function () {

            },
            function (error) {

            })
    }

    initAutocompleteInput() {
        document.getElementById("cityInput").addEventListener('input', function (event) {
            let input = event.target.value;
            input = input.replace(/^(.)/, function(v) { return v.toUpperCase(); });
            input = input.replace("-", " ");
            input = input.replace(/\s(.)/, function(v) { return v.toUpperCase(); });
            document.getElementById("cityInput").value = input;
            self.httpClient.getCities(input,
                function (cities) {
                    const list = document.getElementById("cities");
                    list.textContent = "";
                    if (cities && cities.length > 0) {
                        cities.forEach(function (city) {
                            list.appendChild(WeatherManager.getCityElement(city))
                        });
                    } else {
                        list.innerHTML += '<option value="Не найдено городов">';
                    }
                })
        });
    }

    static getCityElement(city) {
        var option = WeatherManager.getTemplate("autoOption");
        option.querySelector("option").setAttribute("value", city.name);
        if (city.point) {
            option.querySelector("option").setAttribute("lat", city.point.lat);
            option.querySelector("option").setAttribute("lng", city.point.lng);
            option.querySelector("option").innerHTML = city.country + ", " + city.name;
        }
        return option;
    }

    initUpdateButtonListener() {
        document.getElementById("refreshWeatherButton").addEventListener('click', function () {
            self._this.updateLocalWeather();
        });
    }

    setLocalWeather(weather) {
        let node = WeatherManager.getTemplate("localWeatherTemplate");
        self._this.fillLocalWeather(node, weather);
        document.getElementById("localWeather").appendChild(node);
        document.querySelector("#localWeather > .loader-wrapper").remove();
    }

    getFavoriteCityCard(weather) {
        const node = WeatherManager.getTemplate("favoriteCityTemplate");
        node.querySelector(".favorite-item-city").innerText = weather.city;
        node.querySelector(".degrees").innerText = weather.temp;
        node.querySelector(".favorite-item-icon").setAttribute("src", weather.icon);
        node.querySelector(".favorite-item-button").addEventListener('click', function () {
            const card = this.parentElement.parentElement;
            const pos = JSON.parse(card.querySelector(".list-reset > .details-item:last-child .details-value").innerHTML);
            card.remove();
            self.storageManager.deletePoint(new Point(pos[0], pos[1]));
        })
        const list = node.querySelector(".list-reset");
        weather.options.forEach(function (option) {
            const prop = WeatherManager.getTemplate("weatherPropertyTemplate");
            self._this.fillProp(prop, option);
            list.appendChild(prop);
        });
        return node;
    }

    updateLocalWeather() {
        self.localWeather.innerHTML = "";
        self.localWeather.appendChild(WeatherManager.getTemplate("loader"));
        this.getUserPosition(
            function (point) {
                self.httpClient.getWeather(point,
                    function (weather) {
                        self._this.setLocalWeather(weather);
                    },
                    function (error) {
                        alert("Не могу получить погоду по вашему местоположению. Извините :(");
                    }
                );
            },
            function (err, point) {
                alert("Я не смог узнать ваше местоположение. Использую свое любимое место!");
                self.httpClient.getWeather(point,
                    function (weather) {
                        self._this.setLocalWeather(weather);
                    },
                    function (error) {
                        alert("Не могу получить погоду по своему любимому месту. Извините :(");
                    }
                );
            },
            function (point) {
                alert("Вы очень скрытный человек. Я смогу показать погоду в вашем месте, когда вы разрешите узнать ваше местонахождение. А пока я любезно покажу погоду в своем любимом месте!");
                self.httpClient.getWeather(point,
                    function (weather) {
                        self._this.setLocalWeather(weather);
                    },
                    function (error) {
                        alert("Не могу получить погоду по своему любимому месту. Извините :(");
                    }
                );
            }
        );
    }

    getUserPosition(onSuccess, onError, onDisallow) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (pos) {
                const position = new Point(pos.coords.latitude, pos.coords.longitude)
                onSuccess(position);
            }, function (err) {
                onError(err, self.defaultPoint)
            });
        } else {
            onDisallow(self.defaultPoint);
        }
    }

    static getTemplate(id) {
        return document.getElementById(id).content.cloneNode(true);
    }

    fillLocalWeather(node, weather) {
        node.querySelector(".local-city").innerText = weather.city;
        node.querySelector(".local-icon").setAttribute('src', weather.icon);
        node.querySelector(".degrees").innerText = weather.temp;
        const optionList = node.querySelector(".list-reset");
        weather.options.forEach(function (option) {
            const prop = WeatherManager.getTemplate("weatherPropertyTemplate");
            self._this.fillProp(prop, option);
            optionList.appendChild(prop);
        });
    }

    fillProp(node, option) {
        node.querySelector(".details-property").innerText = option.name;
        node.querySelector(".details-value").innerText = option.value + option.unit;
    }

    static getDirection(angle) {
        let directions = ['Северный', 'Северо-Западный', 'Западный', 'Юго-Западный', 'Южный', 'Юго-Восточный', 'Восточный', 'Северо-Восточный'];
        return directions[Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8];
    }
}

class StorageManager {

    static ITEM = "cities"

    constructor() {
        self.lStorage = window.localStorage;
    }

    savePoint(point) {
        let points = self.lStorage.getItem(StorageManager.ITEM);
        if (points && points !== "") {
            points = JSON.parse(points);
            points.push(point);
            self.lStorage.setItem(StorageManager.ITEM, JSON.stringify(points));
        } else {
            points = []
            points.push(point);
            self.lStorage.setItem(StorageManager.ITEM, JSON.stringify(points));
        }
    }

    loadPoints() {
        let points = self.lStorage.getItem(StorageManager.ITEM);
        if (points && points !== "") {
            return JSON.parse(points);
        } else {
            return [];
        }
    }

    deletePoint(point) {
        let points = self.lStorage.getItem(StorageManager.ITEM);
        if (points && points !== "") {
            points = JSON.parse(points);
            points.some(function (element) {
                if (element.lat === point.lat && element.lng === point.lng) {
                    points.splice(points.indexOf(element), 1);
                    return true;
                }
            });
            self.lStorage.setItem(StorageManager.ITEM, JSON.stringify(points));
        }
    }
}

class HttpClient {

    static WEATHER_ICON_PREFIX = "http://openweathermap.org/img/wn/";
    static WEATHER_ICON_POSTFIX = "@4x.png";

    static WEATHER_API_KEY = "6d2a4733147114b53616a260387a5b83";
    static GET_WEATHER_BY_LAT_LNG = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&";

    static CITIES_API_KEY = "4199bfcf95msh9e0af763bc60280p173f25jsn8a42f3856b77";
    static GET_CITIES_BY_NAME = "https://parseapi.back4app.com/classes/City?limit=20&include=country&keys=name,country,country.name,location&where=";

    getWeather(point, onSuccess, onFail, onError) {
        fetch(HttpClient.GET_WEATHER_BY_LAT_LNG + "lat=" + point.lat + "&lon=" + point.lng + "&appid=" + HttpClient.WEATHER_API_KEY)
            .then(function (response) {
                if (response.status !== 200) {
                    onFail();
                    return;
                }
                response.json().then(function (data) {
                    let weather = new Weather(data);
                    onSuccess(weather);
                });
            })
            .catch(function (error) {
                onError(error);
            });
    }

    getCities(input, onSuccess, onFail, onError) {
        const where = encodeURIComponent(JSON.stringify({
            "name": {
                "$regex": input
            }
        }));
        fetch(HttpClient.GET_CITIES_BY_NAME + where,
            {
                "headers": {
                    "X-Parse-Application-Id": "mxsebv4KoWIGkRntXwyzg6c6DhKWQuit8Ry9sHja",
                    "X-Parse-Master-Key": "TpO0j3lG2PmEVMXlKYQACoOXKQrL3lwM0HwR9dbH"
                }
            }
        ).then(function (response) {
            if (response.status !== 200) {
                onFail();
                return;
            }
            response.json().then(function (data) {
                const cities = []
                if (data && data.results) {
                    data.results.forEach(function (city) {
                        cities.push(new City(city));
                    });
                }
                onSuccess(cities);
            })
        })
            .catch(function (error) {
                onError(error);
            })
    }
}

class City {
    constructor(data) {
        this.name = data.name;
        this.country = data.country ? data.country.name : "";
        if (data.location) {
            this.point = new Point(data.location.latitude, data.location.longitude);
        }
    }
}

class Point {
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }

    toOption() {
        return "[ " + this.lat + ", " + this.lng + " ]"
    }
}

class Weather {

    constructor(data) {
        this.point = new Point(data.coord.lat, data.coord.lon);
        this.description = data.weather[0].description;
        this.icon = HttpClient.WEATHER_ICON_PREFIX +
            data.weather[0].icon +
            HttpClient.WEATHER_ICON_POSTFIX;
        this.temp = data.main.temp;
        this.city = data.name;

        this.options = [];
        this.options.push(new WeatherOption("Ветер", WeatherManager.getDirection(data.wind.deg) + ", " + data.wind.speed, "м/с"));
        this.options.push(new WeatherOption("Облачность", data.clouds.all, "%"));
        this.options.push(new WeatherOption("Давление", data.main.pressure, "мм"));
        this.options.push(new WeatherOption("Влажность", data.main.humidity, "%"));
        this.options.push(new WeatherOption("Координаты", this.point.toOption()));
    }
}

class WeatherOption {
    constructor(name, value, unit = "") {
        this.name = name;
        this.value = value;
        this.unit = unit;
    }
}