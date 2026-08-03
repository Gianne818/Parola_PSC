// Calculate the great-circle distance between two points on a sphere
// using the Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const toRad = (degree: number) => degree * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const dLonRad = toRad(lon2 - lon1);

  const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);
  
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;

  const compassDirections = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
  const index = Math.round(brng / 45) % 8;
  return compassDirections[index];
};
