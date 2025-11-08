// backend/utils/bangladeshDistricts.js
export const bangladeshDistricts = [
  { code: 'DHA', name: 'Dhaka', division: 'Dhaka' },
  { code: 'CTG', name: 'Chittagong', division: 'Chittagong' },
  { code: 'SYL', name: 'Sylhet', division: 'Sylhet' },
  { code: 'RAJ', name: 'Rajshahi', division: 'Rajshahi' },
  { code: 'KHU', name: 'Khulna', division: 'Khulna' },
  { code: 'BAR', name: 'Barisal', division: 'Barisal' },
  { code: 'RAN', name: 'Rangpur', division: 'Rangpur' },
  { code: 'MYM', name: 'Mymensingh', division: 'Mymensingh' },
  { code: 'COX', name: "Cox's Bazar", division: 'Chittagong' },
  { code: 'COM', name: 'Comilla', division: 'Chittagong' },
  { code: 'NOA', name: 'Noakhali', division: 'Chittagong' },
  { code: 'FEN', name: 'Feni', division: 'Chittagong' },
  { code: 'BOG', name: 'Bogra', division: 'Rajshahi' },
  { code: 'PAB', name: 'Pabna', division: 'Rajshahi' },
  { code: 'JES', name: 'Jessore', division: 'Khulna' },
  { code: 'KUS', name: 'Kushtia', division: 'Khulna' },
  { code: 'SAT', name: 'Satkhira', division: 'Khulna' },
  { code: 'TAN', name: 'Tangail', division: 'Dhaka' },
  { code: 'GAZ', name: 'Gazipur', division: 'Dhaka' },
  { code: 'NAR', name: 'Narayanganj', division: 'Dhaka' },
  { code: 'FAR', name: 'Faridpur', division: 'Dhaka' },
  { code: 'SUN', name: 'Sunamganj', division: 'Sylhet' },
  { code: 'HAB', name: 'Habiganj', division: 'Sylhet' },
  { code: 'MAO', name: 'Maulvibazar', division: 'Sylhet' },
  { code: 'DIN', name: 'Dinajpur', division: 'Rangpur' },
  { code: 'NIL', name: 'Nilphamari', division: 'Rangpur' },
  { code: 'PAN', name: 'Panchagarh', division: 'Rangpur' },
  { code: 'JAM', name: 'Jamalpur', division: 'Mymensingh' },
  { code: 'NET', name: 'Netrokona', division: 'Mymensingh' },
  { code: 'PAT', name: 'Patuakhali', division: 'Barisal' },
  { code: 'BOL', name: 'Bhola', division: 'Barisal' },
  { code: 'JAL', name: 'Jhalokati', division: 'Barisal' }
];

export const getDistrictByCode = (code) => 
  bangladeshDistricts.find(district => district.code === code);

export const getDistrictsByDivision = (division) => 
  bangladeshDistricts.filter(district => district.division === division);

export const getAllDivisions = () => {
  const divisions = [...new Set(bangladeshDistricts.map(district => district.division))];
  return divisions.sort();
};