export const countryMapping: Record<string, string> = {
    'Czechia': 'Česká republika',
    'Czech Republic': 'Česká republika',
    'Slovakia': 'Slovensko',
    'Slovak Republic': 'Slovenská republika',
    'Germany': 'Německo',
    'Austria': 'Rakousko',
    'Poland': 'Polsko',
    'France': 'Francie',
    'Italy': 'Itálie',
    'Spain': 'Španělsko',
    'United Kingdom': 'Velká Británie',
    'United States': 'Spojené státy',
    'Russia': 'Rusko',
    'Ukraine': 'Ukrajina',
};

export const cityMapping: Record<string, string> = {
    'Prague': 'Praha',
    'Brno': 'Brno',
    'Ostrava': 'Ostrava',
    'Plzen': 'Plzeň',
    'Liberec': 'Liberec',
    'Olomouc': 'Olomouc',
    'Ceske Budejovice': 'České Budějovice',
    'Hradec Kralove': 'Hradec Králové',
    'Usti nad Labem': 'Ústí nad Labem',
    'Pardubice': 'Pardubice',
    'Zlin': 'Zlín',
    'Havirov': 'Havířov',
    'Kladno': 'Kladno',
    'Most': 'Most',
    'Opava': 'Opava',
    'Frydek-Mistek': 'Frýdek-Místek',
    'Karvina': 'Karviná',
    'Teplice': 'Teplice',
    'Karlovy Vary': 'Karlovy Vary',
    'Jihlava': 'Jihlava',
    'Decin': 'Děčín',
    'Chomutov': 'Chomutov',
    'Jablonec nad Nisou': 'Jablonec nad Nisou',
    'Mlada Boleslav': 'Mladá Boleslav',
    'Prostejov': 'Prostějov',
    'Prerov': 'Přerov',
    'Trebic': 'Třebíč',
    'Ceska Lipa': 'Česká Lípa',
    'Trinec': 'Třinec',
    'Tabor': 'Tábor',
};

export const getLocalizedCountry = (country: string | undefined, language: string): string => {
    if (!country) return '';
    if (language === 'cs' && countryMapping[country]) {
        return countryMapping[country];
    }
    return country;
};

export const getLocalizedCity = (city: string | undefined, language: string): string => {
    if (!city) return '';
    if (language === 'cs') {
        if (cityMapping[city]) {
            return cityMapping[city];
        }
    }
    return city;
};
