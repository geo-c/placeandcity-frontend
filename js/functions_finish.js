var testGeoJson = JSON.parse('{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-9.151139259338379,38.76171336595827],[-9.158520698547363,38.7591700932071],[-9.154229164123535,38.7508703622086],[-9.149336814880371,38.749732420636896],[-9.14212703704834,38.750134049145224],[-9.13912296295166,38.754886481591335],[-9.142298698425293,38.76198107360679],[-9.151139259338379,38.76171336595827]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-9.156460762023926,38.74558212707837],[-9.161438941955566,38.73888759683804],[-9.153971672058105,38.7372138662156],[-9.15311336517334,38.74343994568533],[-9.156460762023926,38.74558212707837]]]}}]}');
var fs = {
    opInterpreterUrl: "http://overpass-api.de/api/interpreter",
    contentType: 'application/x-www-form-urlencoded; charset=utf-8',
    queryInitString: "data=[out:json];",
    queryEndString: "out body;",
    wildcardRegExp: new RegExp("zzzzzzzz", "g"),
    query: "(node[natural][name](zzzzzzzz);" +
    "node[amenity=place_of_worship][name](zzzzzzzz);node[historic][name](zzzzzzzz);node[tourism][tourism!=hotel][name](zzzzzzzz);" +
    "node[amenity=bar][name](zzzzzzzz);node[amenity=cafe][name](zzzzzzzz);node[amenity=pub][name](zzzzzzzz);" +
    "node[amenity=arts_centre][name](zzzzzzzz);node[amenity=community_centre][name](zzzzzzzz);node[amenity=social_centre][name](zzzzzzzz);node[amenity=social_facility][name](zzzzzzzz);" +
    "node[leisure][name](zzzzzzzz);node[amenity=theatre][name](zzzzzzzz);node[amenity=cinema][name](zzzzzzzz);" +
    "node[landuse=commercial][name](zzzzzzzz);node[shop][name](zzzzzzzz);" +
    "node[highway=bus_stop][name](zzzzzzzz);node[railway=subway_entrance][name](zzzzzzzz);node[station=subway_entrance][name](zzzzzzzz););"
    ,
    postRequest: function (url, contentType, data, callback) {
        return $.ajax({
            contentType: contentType,
            url: url,
            data: data,
            cache: false,
            method: 'POST',
            success: function (response) {
                callback(response);
            }.bind(this),
            error: function (response) {
                callback(false);
                return false;
            }.bind(this)
        });
    },
    queryOverPass: function (geoJsonPolygons, callback) {
        var currentObject = this;
        var opData = [];
        var promises = [];
        $.each(geoJsonPolygons.features, function (indexG, feature) {
            var polygonString = 'poly:"';
            $.each(feature.geometry.coordinates[0], function (indexC, coordinate) {
                var lat = coordinate[1];
                var lon = coordinate[0];
                polygonString += " " + lat + " " + lon;
            });
            polygonString += '"';
            var finalQuery = currentObject.queryInitString + currentObject.query.replace(currentObject.wildcardRegExp, polygonString) + currentObject.queryEndString;
            var requestPromise = currentObject.postRequest(currentObject.opInterpreterUrl, currentObject.contentType, finalQuery, function (response) {
                var polyData = {
                    naturals: [],
                    cultural: [],
                    social: [],
                    urban: [],
                    leisure: [],
                    commercial: [],
                    transport: []
                };
                $.each(response.elements, function (indexE, element) {
                    var toPush;
                    if (element.tags.natural) {
                        toPush = polyData.naturals;
                    }
                    else if ((element.tags.tourism) || (element.tags.historic) || (element.tags.amenity == "place_of_worship")) {
                        toPush = polyData.cultural;
                    }
                    else if ((element.tags.amenity == "bar") || (element.tags.amenity == "cafe") || (element.tags.amenity == "pub")) {
                        toPush = polyData.social;
                    }
                    else if ((element.tags.amenity == "arts_centre") || (element.tags.amenity == "community_centre") || (element.tags.amenity == "social_centre") || (element.tags.amenity == "social_facility")) {
                        toPush = polyData.urban;
                    }
                    else if ((element.tags.leisure) || (element.tags.amenity == "theatre") || (element.tags.amenity == "cinema")) {
                        toPush = polyData.leisure;
                    }
                    else if ((element.tags.landuse) || (element.tags.shop)) {
                        toPush = polyData.commercial;
                    }
                    else if ((element.tags.highway) || (element.tags.railway) || (element.tags.station)) {
                        toPush = polyData.transport;
                    }
                    else {
                        //alert("PANIC")
                    }
                    toPush.push(element);
                });
                opData.push(polyData);
            });
            promises.push(requestPromise);
        });
        $.when.apply(null, promises).done(function () {
            callback(opData);
        }).fail(function () {
            callback(false);
        });
    }
};

//(function() {
fs.queryOverPass(testGeoJson, function (overPassData) {
    if (overPassData === false) {
        alert("SHIT!");
    }
    else {
        alert("GOOD!");
        var html = '<ul class="media-list" style="list-style:none; padding:0px"> <li class="media"> <input type="checkbox" id="all" class="col-lg-1 col-md-1 col-sm-1 col-xs-1 col-xs-offset-3" name="all" value="1"><p class="tematic-freguesia col-lg-8 col-md-8 col-sm-8 col-xs-6"> All </p></li>';
        for (var i = 0; i < overPassData.length; i++) {

            for (var prop in overPassData[i]) {

                html = html + ' <li class="media"> <input type="checkbox" class="col-lg-1 col-md-1 col-sm-1 col-xs-1 col-xs-offset-3" id="prop" name="prop" value="' + prop + '"><p class="tematic-freguesia col-lg-8 col-md-8 col-sm-8 col-xs-6">' + prop + '</p></li>';

                /*   for (var j = 0; j < overPassData[i][prop].length; j++) {
                 var lat = overPassData[i][prop][j]["lat"];
                 var lon = overPassData[i][prop][j]["lon"];

                 L.marker([lat, lon]).addTo(map);
                 }
                 */

            }

            break;


        }
        html = html + "</ul>";
        document.getElementById("table").innerHTML = html;
        definefunctions(overPassData);
    }
});
//});

var markers = [];

function definefunctions(overPassData) {
    $('#all').change(function () {
        if ($("input[name=all]").prop("checked")) {
            $("input[name=prop]").prop("checked", true);

        } else {
            $("input[name=prop]").prop("checked", false);

        }
        $('input[name=prop]').trigger("change");
    });

    $('input[name=prop]').change(function () {

        for (var i = 0; i < markers.length; i++) {
            map.removeLayer(markers[i]);
        }
        markers = [];
        for (var i = 0; i < overPassData.length; i++) {

            for (var prop in overPassData[i]) {

                if ($("input[value=" + prop + "]").prop("checked")) {
                    for (var j = 0; j < overPassData[i][prop].length; j++) {

                        var lat = overPassData[i][prop][j]["lat"];
                        var lon = overPassData[i][prop][j]["lon"];

                        var m = L.marker([lat, lon]).addTo(map);
                        markers.push(m);
                    }
                }
            }
        }
    });
};

