export const vendorCountryCodes=["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"] as const;
const codeSet=new Set<string>(vendorCountryCodes);
export function validVendorCountry(code:string){return codeSet.has(code.toUpperCase());}
export function vendorCountryName(code:string){
 if(!validVendorCountry(code))return "Location not specified";
 try{return new Intl.DisplayNames(["en"],{type:"region"}).of(code.toUpperCase())||code.toUpperCase();}catch{return code.toUpperCase();}
}
export const vendorCountryOptions=vendorCountryCodes.map(code=>({value:code,label:vendorCountryName(code)})).sort((a,b)=>a.label.localeCompare(b.label));
export const vendorShippingModes=[
 {value:"not_specified",label:"Not specified yet"},
 {value:"pickup_only",label:"Pickup / local arrangements only"},
 {value:"domestic",label:"Ships within home country"},
 {value:"selected",label:"Ships to selected countries"},
 {value:"worldwide",label:"International shipping available (subject to restrictions)"}
] as const;
export type VendorShippingMode=(typeof vendorShippingModes)[number]["value"];
export function vendorShippingLabel(mode:string){
 return vendorShippingModes.find(item=>item.value===mode)?.label||"Shipping information unavailable";
}
