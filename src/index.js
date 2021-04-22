//  user location Icon
const myIcon = L.icon({
  iconUrl: '../icon/user.svg',
  iconSize: [38, 95],
  iconAnchor: [22, 94],
  popupAnchor: [-3, -76],
  shadowSize: [68, 95],
  shadowAnchor: [22, 94],
});
const markerIcon = L.icon({
  iconUrl: '../icon/marker.svg',
  iconSize: [38, 95],
  iconAnchor: [22, 94],
  popupAnchor: [-3, -76],
  shadowSize: [68, 95],
  shadowAnchor: [22, 94],
  className: 'marker',
});

let carte;

// openstreetmap api data query endpoint
const url = 'https://www.openstreetmap.org/api/0.6/map?bbox=';

const fetchData = async ({ left, bottom, right, top }) => {
  // fetch  data in BBOX query and getting on osm and then convert to GeoJSON
  // reference exemple of query bbox data : https://wiki.openstreetmap.org/wiki/Xapi
  const res = await axios
    .get(`${url}${left},${bottom},${right},${top}`)
    .then((response) => {
      const resultAsGeojson = osmtogeojson(response.data);
      const data = resultAsGeojson.features;
      return data;
    })
    .catch(function (error) {
      console.log(error);
    });
  // maping(res);
  return res;
};
// fetchData(box);

const maping = async (box, init) => {
  // setting map with default lnt lat and default zoom
  carte = L.map('myMap').setView([init.lat, init.lng], 16);

  // setting the URL template for the tile images
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const options = {
    attribution:
      'data © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - from <a href="//openstreetmap.org">OSM</a>',
  };

  // display the map
  L.tileLayer(tileUrl, { options }).addTo(carte);

  // add marker for user position
  const Point = [init.lat, init.lng];
  let marker = L.marker(Point, { icon: myIcon }).addTo(carte);
  marker.bindPopup(' 😀 Hahaha you are Here!📍 i can see you  🤗').openPopup();

  const data = await fetchData(box);
  data.forEach((data) => {
    const { geometry } = data;
    const { properties } = data;
    const array = geometry.coordinates;

    // marker information on popup
    const popupProps = `
    ${properties.name ? `<span><b>Name:</b> ${properties.name}</span><br>` : ''}
    ${
      properties.amenity
        ? `<span><b>Amenity:</b> ${properties.amenity}</span><br>`
        : ''
    }
    ${
      properties.comment
        ? `<span><b>Comment:</b> ${properties.comment}</span><br>`
        : ''
    }
    ${properties.note ? `<span><b>Note:</b> ${properties.note}</span><br>` : ''}
    ${
      properties.public_transpor
        ? `<span><b>Public transport:</b> ${properties.public_transpor}</span><br>`
        : ''
    }
    `;

    // display location with marker
    if (geometry.type === 'Point') {
      // we only show marker to the map when the place have somme needed information
      if (
        properties.name ||
        properties.amenity ||
        properties.comment ||
        properties.note ||
        properties.public_transport
      ) {
        const Point = geometry.coordinates.reverse();
        let marker = L.marker(Point).addTo(carte);
        marker.bindPopup(popupProps);
      }
    }

    // display location with Polygon
    if (geometry.type === 'Polygon') {
      // reverse  nested array to get [latitude , longitude] instead of [longitude , latitude ]
      const reversed = array.map(function reverse(item) {
        return Array.isArray(item) && Array.isArray(item[0])
          ? item.map(reverse)
          : item.reverse();
      });
      // data is a nested array
      if (geometry.coordinates.length > 1) {
        let polygon = L.polygon(reversed, {
          color: 'green',
          fillColor: 'green',
          fillOpacity: 0.4,
        }).addTo(carte);
        polygon.bindPopup(popupProps);
      } else {
        let polygon = L.polygon(reversed[0], {
          color: 'green',
          fillColor: 'green',
          fillOpacity: 0.4,
        }).addTo(carte);
        polygon.bindPopup(popupProps);
      }
    }

    // display location with polyline
    if (geometry.type === 'LineString') {
      // reverse nested array to get [latitude , longitude] instead of [longitude , latitude ]
      const reversed = array.map(function reverse(item) {
        return Array.isArray(item) && Array.isArray(item[0])
          ? item.map(reverse)
          : item.reverse();
      });
      if (geometry.coordinates.length > 1) {
        let polygon = L.polyline(reversed, {
          color: '#ab0e9b',
        }).addTo(carte);
        polygon.bindPopup(popupProps);
      }
    }
  });
};

window.onload = () => {
  //  default value
  var box = {
    left: 13.2855,
    bottom: 52.5498,
    right: 13.2993,
    top: 52.5565,
  };
  var init = {
    lat: 52.55381,
    lng: 13.29277,
  };

  // getting user geolocation
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  const success = (pos) => {
    const crd = pos.coords;
    const lat = crd.latitude;
    const lng = crd.longitude;
    // if user accept geolocation then we pass de info to getDounding
    const equatorApproximate = 0.05;
    focusOnPinCluster(lat, lng, equatorApproximate);
  };

  const error = (err) => {
    console.warn(`ERROR (${err.code}): ${err.message}`);
    // if we have erro then we pass  the default location information
    maping(box, init);
  };

  const rad = (degrees) => {
    const pi = Math.PI;
    return degrees * (pi / 180);
  };

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(success, error, options);
  }
  const latitude_degree_distance = () => {
    const earth = 6371;
    return (2 * Math.PI * earth) / 360;
  };

  const longitude_degree_distance = (latitude) => {
    return latitude_degree_distance() * Math.cos(latitude * (Math.PI / 180));
  };

  function focusOnPinCluster(lat, lng, radius) {
    const left = lng - radius / longitude_degree_distance(lat);
    const bottom = lat - radius / latitude_degree_distance();
    const right = lng + radius / longitude_degree_distance(lat);
    const top = lat + radius / latitude_degree_distance();
    init = {
      lat,
      lng,
    };
    box = {
      left,
      bottom,
      right,
      top,
    };
    maping(box, init);
  }
};
