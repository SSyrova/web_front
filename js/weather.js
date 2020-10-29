function WeatherUpdater() {

    _this = this;
    _this.weatherApiKey = "6d2a4733147114b53616a260387a5b83";
    _this.GET_WEATHER_BY_LAT_LON = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&";
    _this.GET_WEATHER_ICON = "http://openweathermap.org/img/wn/";
    _this.GET_WEATHER_ICON_POSTFIX = "@4x.png";
    _this.GET_CITIES = "https://parseapi.back4app.com/classes/City?limit=20&keys=name,country.name,location&where=";
    _this.defaultCity = "Saint-Petersburg";
    _this.currentCity = null;
    _this.lStorage = window.localStorage;

    this.init = function () {
        _this.initLocalWeather();
        _this.initStoredWeather();
        _this.initAutoComplete();
        _this.initAddButton();
        _this.initRefreshButton();
    };

    this.initRefreshButton = function () {
        var button = document.getElementsByClassName("refresh-button")[0];
        button.addEventListener('click', function () {
            _this.initLocalWeather();
        });
    };

    this.initDeleteButton = function () {
        var buttons = document.getElementsByClassName("favorite-item-button");
        for (const button of buttons) {
            button.addEventListener('click', function () {
                _this.deleteCard(this);
            });
        }
    };

    this.deleteCard = function (button) {
        var card = button.parentElement.parentElement;
        var position = card.lastElementChild.lastElementChild.lastElementChild.innerHTML;
        var arrayPos = JSON.parse(position);
        var deleteCity = {
            lat: arrayPos[0],
            lon: arrayPos[1]
        };
        var cities = JSON.parse(_this.lStorage.getItem("cities"));
        // var idx = cities.indexOf(deleteCity);
        // if (idx > -1) {
        //     cities.splice(idx, 1);
        // }
        for (const it of cities) {
            if (it.lat === deleteCity.lat && it.lon === deleteCity.lon) {
                cities.splice(cities.indexOf(it), 1);
                break;
            }
        }
        _this.lStorage.setItem("cities", JSON.stringify(cities));
        card.remove();
    };

    this.initAddButton = function () {
        var button = document.getElementsByClassName("favorites-add-button")[0];
        button.addEventListener('click', function () {
            var datalist = document.getElementById("cities");
            var input = document.getElementsByClassName("favorites-input")[0];
            for (const el of datalist.children) {
                if (el.value === input.value) {
                    var position = {
                        lat: el.getAttribute("lat"),
                        lon: el.getAttribute("lon")
                    };

                    let item = _this.createStoreElement();
                    let loader = _this.createLoader();
                    item.appendChild(loader);
                    var list = document.getElementsByClassName("favorites-list")[0];
                    list.appendChild(item);
                    _this.getWeather(position, function (weather) {
                        _this.saveToStorage(weather.coord);
                        _this.fillStoreElement(item, weather);
                        loader.remove();
                    }, function (weather) {

                    });
                    break;
                }
            }
        });
    };

    this.saveToStorage = function (position) {
        var cities = _this.lStorage.getItem("cities");
        if (cities && cities !== "") {
            cities = JSON.parse(cities);
            cities.push({lat: position.lat, lon: position.lon});
            _this.lStorage.setItem("cities", JSON.stringify(cities));
        } else {
            cities = JSON.stringify([{lat: position.lat, lon: position.lon}]);
            _this.lStorage.setItem("cities", cities);
        }
    };

    this.initAutoComplete = function () {
        var input = document.getElementsByClassName("favorites-input")[0];
        input.addEventListener('input', (event) => {
            fetch(_this.GET_CITIES + encodeURIComponent(JSON.stringify({
                "name": {
                    "$regex": event.target.value
                }
            })), {
                headers: {
                    'X-Parse-Application-Id': 'mxsebv4KoWIGkRntXwyzg6c6DhKWQuit8Ry9sHja',
                    'X-Parse-Master-Key': 'TpO0j3lG2PmEVMXlKYQACoOXKQrL3lwM0HwR9dbH',
                }
            })
                .then(function (response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }
                    response.json().then(function (data) {
                        var list = document.getElementById("cities");
                        list.textContent = "";
                        if (data.results.length < 1) {
                            var opt = document.createElement("option");
                            opt.classList.add("disabled");
                            opt.setAttribute("value", "Не удалось найти город");
                            list.appendChild(opt);
                        }
                        for (const item of data.results) {
                            list.appendChild(_this.createOptionEl(item.country.name, item.name, item.location));
                        }
                    });
                })
                .catch(function (err) {

                });
        });
        input.addEventListener('change', function () {
            console.log(this);
        });
    };

    this.createOptionEl = function (country, name, location) {
        var option = document.createElement("option");
        option.setAttribute("value", name);
        option.setAttribute("lat", location.latitude);
        option.setAttribute("lon", location.longitude);
        option.innerHTML = country + ", " + name;
        return option;
    };

    this.initStoredWeather = function () {
        var cities = _this.lStorage.getItem("cities");
        if (cities && cities !== "") {
            cities = JSON.parse(cities);
            var list = document.querySelectorAll(".favorites .favorites-list")[0];
            for (const city of cities) {
                let item = _this.createStoreElement();
                let loader = _this.createLoader();
                item.appendChild(loader);
                list.appendChild(item);
                _this.getWeather(city, function (weather) {
                    _this.fillStoreElement(item, weather);
                    loader.remove();
                }, function (weather) {

                });
            }
        }
        _this.initDeleteButton();
    };

    this.fillStoreElement = function (item, weather) {
        if (weather != null) {
            item.getElementsByClassName("favorite-item-city")[0].innerHTML = weather.name;
            item.getElementsByClassName("favorite-item-degrees")[0].innerHTML = weather.main.temp;
            item.getElementsByClassName("favorite-item-icon")[0].setAttribute("src", _this.GET_WEATHER_ICON +
                weather.weather[0].icon.replace("n", "d") +
                _this.GET_WEATHER_ICON_POSTFIX);
            var parameters = _this.getParameters(weather);
            _this.setParameters(item.getElementsByClassName("list-reset")[0], parameters);
        }
    };

    this.createStoreElement = function (weather) {
        var node = document.createElement("li");
        node.classList.add("favorites-item");

        var general = document.createElement("div");
        general.classList.add("favorite-item-general");

        var city = document.createElement("h3");
        city.classList.add("favorite-item-city");

        var short = document.createElement("p");
        short.classList.add("favorite-item-short-info");

        var degrees = document.createElement("span");
        degrees.classList.add("favorite-item-degrees");
        degrees.classList.add("degrees");


        var img = document.createElement("img");
        img.classList.add("favorite-item-icon");
        img.setAttribute("width", 30);
        img.setAttribute("height", 30);
        img.setAttribute("src", "img/cloud.svg");

        short.appendChild(degrees);
        short.appendChild(img);

        var button = document.createElement("button");
        button.classList.add("favorite-item-button");
        button.addEventListener('click', function () {
            _this.deleteCard(this);
        });

        general.appendChild(city);
        general.appendChild(short);
        general.appendChild(button);

        node.appendChild(general);

        var list = document.createElement("ul");
        list.classList.add("list-reset");

        node.appendChild(list);

        return node;
    };

    this.createLoader = function () {
        var loader_wr = document.createElement("div");
        loader_wr.classList.add("loader-wrapper");
        var loader = document.createElement("div");
        loader.classList.add("loader");
        loader_wr.appendChild(loader);
        return loader_wr;
    };

    this.initLocalWeather = function () {
        var loader = _this.createLoader();
        document.getElementsByClassName("local")[0].appendChild(loader);
        _this.getCurrentPosition(function (position) {
            _this.getWeather(position, function (weather) {
                document.querySelectorAll(".local .local-city")[0].innerHTML = weather != null ? weather.name : "...";
                document.querySelectorAll(".local .local-icon")[0]
                    .setAttribute(
                        "src",
                        weather != null ? (_this.GET_WEATHER_ICON +
                            weather.weather[0].icon.replace("n", "d") +
                            _this.GET_WEATHER_ICON_POSTFIX) : "img/cloud.svg");
                document.querySelectorAll(".local .local-degrees")[0].innerHTML = weather != null ? weather.main.temp : "...";
                var parametersDiv = document.querySelectorAll(".local .list-reset")[0];
                var parameters = _this.getParameters(weather);
                _this.setParameters(parametersDiv, parameters);
                loader.remove();
            });
        });
    };

    this.setParameters = function (div, params) {
        div.textContent = "";
        for (const item of params) {
            div.appendChild(_this.createParam(item.name, item.value));
        }
    };

    this.createParam = function (name, value) {
        var node = document.createElement("li");
        node.classList.add("details-item");
        var nameEl = document.createElement("span");
        nameEl.classList.add("details-property");
        nameEl.innerHTML = name;
        var valueEl = document.createElement("span");
        valueEl.classList.add("details-value");
        valueEl.innerHTML = value;
        node.appendChild(nameEl);
        node.appendChild(valueEl);
        return node;
    };

    this.getParameters = function (weather) {
        return [
            {
                name: "Ветер",
                value: weather != null ? (_this.getDirection(weather.wind.deg) + ", " + weather.wind.speed + " м/с") : "..."
            },
            {
                name: "Облачность",
                value: weather != null ? weather.clouds.all + " %" : "..."
            },
            {
                name: "Давление",
                value: weather != null ? weather.main.pressure + " мм" : "..."
            },
            {
                name: "Влажность",
                value: weather != null ? weather.main.humidity + " %" : "..."
            },
            {
                name: "Координаты",
                value: weather != null ? ("[" + weather.coord.lat + ", " + weather.coord.lon + "]") : "..."
            }
        ];
    };

    this.getDirection = function (angle) {
        var directions = ['Северный', 'Северо-Западный', 'Западный', 'Юго-Западный', 'Южный', 'Юго-Восточный', 'Восточный', 'Северо-Восточный'];
        return directions[Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8];
    };

    this.getCurrentPosition = function (onSuccess) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                position = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                onSuccess(position);
            }, function (err) {
                onSuccess({
                    lat: 36.114647,
                    lon: -115.172813
                });
            });
        } else {
            onSuccess({
                lat: 36.114647,
                lon: -115.172813
            });
        }
    };

    this.getWeather = function (position, onSuccess, onError) {
        fetch(_this.GET_WEATHER_BY_LAT_LON + "lat=" + position.lat + "&lon=" + position.lon + "&appid=" + _this.weatherApiKey)
            .then(function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }
                response.json().then(function (data) {
                    onSuccess(data);
                });
            })
            .catch(function (err) {
                onError(null);
            });
    };

}

