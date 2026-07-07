import type { CurrencyMeta } from '../types';

const CURRENCIES: CurrencyMeta[] = [
  {"code":"USD","name":"United States Dollar","symbol":"$","locale":"en-US","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"EUR","name":"Euro","symbol":"€","locale":"de-DE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GBP","name":"British Pound","symbol":"£","locale":"en-GB","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"JPY","name":"Japanese Yen","symbol":"¥","locale":"ja-JP","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"CAD","name":"Canadian Dollar","symbol":"$","locale":"en-CA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AUD","name":"Australian Dollar","symbol":"$","locale":"en-AU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CHF","name":"Swiss Franc","symbol":"Fr","locale":"de-CH","decimalDigits":2,"rounding":{"decimals":2,"step":5},"isActive":true},
  {"code":"SEK","name":"Swedish Krona","symbol":"kr","locale":"sv-SE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NZD","name":"New Zealand Dollar","symbol":"$","locale":"en-NZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SGD","name":"Singapore Dollar","symbol":"$","locale":"en-SG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"HKD","name":"Hong Kong Dollar","symbol":"$","locale":"en-HK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NOK","name":"Norwegian Krone","symbol":"kr","locale":"nb-NO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MXN","name":"Mexican Peso","symbol":"$","locale":"es-MX","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BRL","name":"Brazilian Real","symbol":"R$","locale":"pt-BR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ZAR","name":"South African Rand","symbol":"R","locale":"en-ZA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"INR","name":"Indian Rupee","symbol":"₹","locale":"en-IN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CNY","name":"Chinese Yuan","symbol":"¥","locale":"zh-CN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KRW","name":"South Korean Won","symbol":"₩","locale":"ko-KR","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"TRY","name":"Turkish Lira","symbol":"₺","locale":"tr-TR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AED","name":"UAE Dirham","symbol":"د.إ","locale":"ar-AE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SAR","name":"Saudi Riyal","symbol":"﷼","locale":"ar-SA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"THB","name":"Thai Baht","symbol":"฿","locale":"th-TH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MYR","name":"Malaysian Ringgit","symbol":"RM","locale":"ms-MY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"IDR","name":"Indonesian Rupiah","symbol":"Rp","locale":"id-ID","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"PHP","name":"Philippine Peso","symbol":"₱","locale":"en-PH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"DKK","name":"Danish Krone","symbol":"kr","locale":"da-DK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PLN","name":"Polish Zloty","symbol":"zł","locale":"pl-PL","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CZK","name":"Czech Koruna","symbol":"Kč","locale":"cs-CZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"HUF","name":"Hungarian Forint","symbol":"Ft","locale":"hu-HU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"RON","name":"Romanian Leu","symbol":"lei","locale":"ro-RO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BGN","name":"Bulgarian Lev","symbol":"лв","locale":"bg-BG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"HRK","name":"Croatian Kuna","symbol":"kn","locale":"hr-HR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":false},
  {"code":"RSD","name":"Serbian Dinar","symbol":"РСД","locale":"sr-RS","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"TND","name":"Tunisian Dinar","symbol":"د.ت","locale":"ar-TN","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"EGP","name":"Egyptian Pound","symbol":"E£","locale":"ar-EG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XOF","name":"West African CFA Franc","symbol":"CFA","locale":"fr-SN","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"XAF","name":"Central African CFA Franc","symbol":"FCFA","locale":"fr-CM","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"CLP","name":"Chilean Peso","symbol":"$","locale":"es-CL","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"COP","name":"Colombian Peso","symbol":"$","locale":"es-CO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PEN","name":"Peruvian Sol","symbol":"S/","locale":"es-PE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ARS","name":"Argentine Peso","symbol":"$","locale":"es-AR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"VND","name":"Vietnamese Dong","symbol":"₫","locale":"vi-VN","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"KES","name":"Kenyan Shilling","symbol":"Sh","locale":"en-KE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NGN","name":"Nigerian Naira","symbol":"₦","locale":"en-NG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GHS","name":"Ghanaian Cedi","symbol":"₵","locale":"en-GH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"UGX","name":"Ugandan Shilling","symbol":"USh","locale":"en-UG","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"TZS","name":"Tanzanian Shilling","symbol":"TSh","locale":"sw-TZ","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"MAD","name":"Moroccan Dirham","symbol":"د.م.","locale":"ar-MA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KZT","name":"Kazakhstani Tenge","symbol":"₸","locale":"kk-KZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"UAH","name":"Ukrainian Hryvnia","symbol":"₴","locale":"uk-UA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"RUB","name":"Russian Ruble","symbol":"₽","locale":"ru-RU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ILS","name":"Israeli Shekel","symbol":"₪","locale":"he-IL","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"QAR","name":"Qatari Riyal","symbol":"﷼","locale":"ar-QA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BHD","name":"Bahraini Dinar","symbol":"BD","locale":"ar-BH","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"OMR","name":"Omani Rial","symbol":"﷼","locale":"ar-OM","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"JOD","name":"Jordanian Dinar","symbol":"JD","locale":"ar-JO","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"LBP","name":"Lebanese Pound","symbol":"ل.ل","locale":"ar-LB","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"IQD","name":"Iraqi Dinar","symbol":"ع.د","locale":"ar-IQ","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"SYP","name":"Syrian Pound","symbol":"£","locale":"ar-SY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"YER","name":"Yemeni Rial","symbol":"﷼","locale":"ar-YE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SDG","name":"Sudanese Pound","symbol":"£","locale":"ar-SD","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ERN","name":"Eritrean Nakfa","symbol":"Nkfa","locale":"ti-ER","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"DJF","name":"Djiboutian Franc","symbol":"Fdj","locale":"fr-DJ","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"SLL","name":"Sierra Leonean Leone","symbol":"Le","locale":"en-SL","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":false},
  {"code":"GMD","name":"Gambian Dalasi","symbol":"D","locale":"en-GM","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GNF","name":"Guinean Franc","symbol":"FG","locale":"fr-GN","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"CDF","name":"Congolese Franc","symbol":"FC","locale":"fr-CD","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BIF","name":"Burundian Franc","symbol":"FBu","locale":"fr-BI","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"RWF","name":"Rwandan Franc","symbol":"RF","locale":"en-RW","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"KMF","name":"Comorian Franc","symbol":"CF","locale":"fr-KM","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"SCR","name":"Seychellois Rupee","symbol":"₨","locale":"en-SC","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MUR","name":"Mauritian Rupee","symbol":"₨","locale":"en-MU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AOA","name":"Angolan Kwanza","symbol":"Kz","locale":"pt-AO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MZN","name":"Mozambican Metical","symbol":"MT","locale":"pt-MZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ZMW","name":"Zambian Kwacha","symbol":"ZK","locale":"en-ZM","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ZWL","name":"Zimbabwean Dollar","symbol":"Z$","locale":"en-ZW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NAD","name":"Namibian Dollar","symbol":"$","locale":"en-NA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SZL","name":"Swazi Lilangeni","symbol":"E","locale":"en-SZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"LSL","name":"Lesotho Loti","symbol":"L","locale":"en-LS","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MGA","name":"Malagasy Ariary","symbol":"Ar","locale":"fr-MG","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"MWK","name":"Malawian Kwacha","symbol":"MK","locale":"en-MW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"FKP","name":"Falkland Islands Pound","symbol":"£","locale":"en-FK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SHP","name":"Saint Helena Pound","symbol":"£","locale":"en-SH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"TTD","name":"Trinidad and Tobago Dollar","symbol":"$","locale":"en-TT","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BBD","name":"Barbadian Dollar","symbol":"$","locale":"en-BB","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"JMD","name":"Jamaican Dollar","symbol":"J$","locale":"en-JM","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"HTG","name":"Haitian Gourde","symbol":"G","locale":"fr-HT","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"DOP","name":"Dominican Peso","symbol":"RD$","locale":"es-DO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PAB","name":"Panamanian Balboa","symbol":"B/.","locale":"es-PA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GTQ","name":"Guatemalan Quetzal","symbol":"Q","locale":"es-GT","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"HNL","name":"Honduran Lempira","symbol":"L","locale":"es-HN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NIO","name":"Nicaraguan Cordoba","symbol":"C$","locale":"es-NI","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CRC","name":"Costa Rican Colon","symbol":"₡","locale":"es-CR","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"SVC","name":"Salvadoran Colon","symbol":"₡","locale":"es-SV","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BZD","name":"Belize Dollar","symbol":"BZ$","locale":"en-BZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BMD","name":"Bermudan Dollar","symbol":"$","locale":"en-BM","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KYD","name":"Cayman Islands Dollar","symbol":"$","locale":"en-KY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AWG","name":"Aruban Florin","symbol":"ƒ","locale":"nl-AW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ANG","name":"Netherlands Antillean Guilder","symbol":"ƒ","locale":"nl-AN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XCD","name":"East Caribbean Dollar","symbol":"$","locale":"en-VG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"WST","name":"Samoan Tala","symbol":"WS$","locale":"en-WS","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"FJD","name":"Fijian Dollar","symbol":"FJ$","locale":"en-FJ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"TOP","name":"Tongan Pa'anga","symbol":"T$","locale":"en-TO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"VUV","name":"Vanuatu Vatu","symbol":"VT","locale":"bi-VU","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"SBD","name":"Solomon Islands Dollar","symbol":"SI$","locale":"en-SB","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PGK","name":"Papua New Guinean Kina","symbol":"K","locale":"en-PG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"LAK","name":"Lao Kip","symbol":"₭","locale":"lo-LA","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"MMK","name":"Myanmar Kyat","symbol":"K","locale":"my-MM","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"BTN","name":"Bhutanese Ngultrum","symbol":"Nu.","locale":"dz-BT","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"NPR","name":"Nepalese Rupee","symbol":"₨","locale":"ne-NP","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MVR","name":"Maldivian Rufiyaa","symbol":"Rf","locale":"dv-MV","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PKR","name":"Pakistani Rupee","symbol":"₨","locale":"ur-PK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BDT","name":"Bangladeshi Taka","symbol":"৳","locale":"bn-BD","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"LKR","name":"Sri Lankan Rupee","symbol":"₨","locale":"si-LK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AFN","name":"Afghan Afghani","symbol":"؋","locale":"fa-AF","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"TJS","name":"Tajikistani Somoni","symbol":"ЅМ","locale":"tg-TJ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"UZS","name":"Uzbekistani Som","symbol":"лв","locale":"uz-UZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KGS","name":"Kyrgyzstani Som","symbol":"с","locale":"ru-KG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"TMT","name":"Turkmenistani Manat","symbol":"m","locale":"tk-TM","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AZN","name":"Azerbaijani Manat","symbol":"₼","locale":"az-AZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GEL","name":"Georgian Lari","symbol":"₾","locale":"ka-GE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"AMD","name":"Armenian Dram","symbol":"֏","locale":"hy-AM","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"BYN","name":"Belarusian Ruble","symbol":"Br","locale":"be-BY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MDL","name":"Moldovan Leu","symbol":"L","locale":"ro-MD","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MKD","name":"Macedonian Denar","symbol":"ден","locale":"mk-MK","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ALL","name":"Albanian Lek","symbol":"L","locale":"sq-AL","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"XAU","name":"Gold (troy ounce)","symbol":"XAU","locale":"en-XAU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XAG","name":"Silver (troy ounce)","symbol":"XAG","locale":"en-XAG","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XPT","name":"Platinum (troy ounce)","symbol":"XPT","locale":"en-XPT","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XPD","name":"Palladium (troy ounce)","symbol":"XPD","locale":"en-XPD","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ISK","name":"Icelandic Krona","symbol":"kr","locale":"is-IS","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"BAM","name":"Bosnia-Herzegovina Convertible Mark","symbol":"KM","locale":"bs-BA","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GIP","name":"Gibraltar Pound","symbol":"£","locale":"en-GI","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KWD","name":"Kuwaiti Dinar","symbol":"KD","locale":"ar-KW","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"LYD","name":"Libyan Dinar","symbol":"ل.د","locale":"ar-LY","decimalDigits":3,"rounding":{"decimals":3,"step":1},"isActive":true},
  {"code":"DZD","name":"Algerian Dinar","symbol":"دج","locale":"ar-DZ","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MRU","name":"Mauritanian Ouguiya","symbol":"UM","locale":"fr-MR","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"CVE","name":"Cape Verdean Escudo","symbol":"Esc","locale":"pt-CV","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"LRD","name":"Liberian Dollar","symbol":"L$","locale":"en-LR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SOS","name":"Somali Shilling","symbol":"Sh","locale":"so-SO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SSP","name":"South Sudanese Pound","symbol":"£","locale":"en-SS","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BWP","name":"Botswana Pula","symbol":"P","locale":"en-BW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ETB","name":"Ethiopian Birr","symbol":"Br","locale":"am-ET","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"GYD","name":"Guyanese Dollar","symbol":"G$","locale":"en-GY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SRD","name":"Surinamese Dollar","symbol":"$","locale":"nl-SR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"PYG","name":"Paraguayan Guarani","symbol":"₲","locale":"es-PY","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"UYU","name":"Uruguayan Peso","symbol":"$","locale":"es-UY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BOB","name":"Bolivian Boliviano","symbol":"Bs.","locale":"es-BO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"VES","name":"Venezuelan Bolivar Soberano","symbol":"Bs.S.","locale":"es-VE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CUC","name":"Cuban Convertible Peso","symbol":"CUC","locale":"es-CU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":false},
  {"code":"CUP","name":"Cuban Peso","symbol":"$","locale":"es-CU","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"STN","name":"Sao Tome and Principe Dobra","symbol":"Db","locale":"pt-ST","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KPW","name":"North Korean Won","symbol":"₩","locale":"ko-KP","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"TWD","name":"New Taiwan Dollar","symbol":"NT$","locale":"zh-TW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XDR","name":"Special Drawing Right","symbol":"SDR","locale":"en-XDR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"KHR","name":"Cambodian Riel","symbol":"៛","locale":"km-KH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MNT","name":"Mongolian Tugrik","symbol":"₮","locale":"mn-MN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MOP","name":"Macanese Pataca","symbol":"P","locale":"pt-MO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XPF","name":"CFP Franc","symbol":"₣","locale":"fr-PF","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},
  {"code":"BSD","name":"Bahamian Dollar","symbol":"$","locale":"en-BS","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"BND","name":"Brunei Dollar","symbol":"$","locale":"ms-BN","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"IRR","name":"Iranian Rial","symbol":"﷼","locale":"fa-IR","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"TVD","name":"Tuvaluan Dollar","symbol":"$","locale":"en-TV","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"SLE","name":"Sierra Leonean Leone","symbol":"Le","locale":"en-SL","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"VED","name":"Venezuelan Digital Bolivar","symbol":"Bs.D.","locale":"es-VE","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CLF","name":"Unidad de Fomento","symbol":"UF","locale":"es-CL","decimalDigits":4,"rounding":{"decimals":4,"step":1},"isActive":true},
  {"code":"BOV","name":"Bolivian Mvdol","symbol":"BOV","locale":"es-BO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"COU","name":"Unidad de Valor Real","symbol":"UVR","locale":"es-CO","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"MXV","name":"Mexican Unidad de Inversion","symbol":"UDI","locale":"es-MX","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XUA","name":"ADB Unit of Account","symbol":"ADB","locale":"en-US","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XSU","name":"Sucre","symbol":"SUCRE","locale":"es-EC","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CHE","name":"WIR Euro","symbol":"CHE","locale":"de-CH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"CHW","name":"WIR Franc","symbol":"CHW","locale":"de-CH","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"USN","name":"US Dollar (Next Day)","symbol":"USN","locale":"en-US","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"UYI","name":"Uruguay Peso en Unidades Indexadas","symbol":"UI","locale":"es-UY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"UYW","name":"Unidad Previsional","symbol":"UP","locale":"es-UY","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"ZWG","name":"Zimbabwe Gold","symbol":"ZiG","locale":"en-ZW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XCG","name":"Caribbean Guilder","symbol":"Cg","locale":"nl-CW","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"EXT","name":"Extraordinary Currency","symbol":"","locale":"en-US","decimalDigits":2,"rounding":{"decimals":2,"step":1},"isActive":true},
  {"code":"XTS","name":"Reserved for testing","symbol":"","locale":"en-US","decimalDigits":0,"rounding":{"decimals":0,"step":1},"isActive":true},

];

export function getAllCurrencies(): CurrencyMeta[] {
  return CURRENCIES;
}

export function getActiveCurrencies(): CurrencyMeta[] {
  return CURRENCIES.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name));
}

export function searchCurrencies(query: string): CurrencyMeta[] {
  const q = query.toLowerCase();
  const matched = CURRENCIES.filter(
    c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
  );

  // Deduplicate by code — keep the first match so duplicates do not appear.
  const seen = new Set<string>();
  const deduped: CurrencyMeta[] = [];
  for (const currency of matched) {
    if (!seen.has(currency.code)) {
      seen.add(currency.code);
      deduped.push(currency);
    }
  }

  // Return active currencies first, then inactive (deprecated) ones.
  return deduped
    .filter(c => c.isActive)
    .concat(deduped.filter(c => !c.isActive));
}

/** Returns inactive/deprecated currencies. Intended for explicit opt-in views. */
export function getDeprecatedCurrencies(): CurrencyMeta[] {
  return CURRENCIES.filter(c => !c.isActive).sort((a, b) => a.name.localeCompare(b.name));
}

export function validCurrency(code: string): boolean {
  if (typeof code !== "string" || code.length !== 3 || !/^[A-Z]{3}$/.test(code)) return false;
  return getInvalidCurrencyReason(code) === null;
}

/**
 * Returns a human-readable reason why `code` is not accepted, or null if it is valid.
 * Checks the active list first; if not found there, falls back to the full list
 * to distinguish known-but-inactive currencies from completely unknown codes.
 */
export function getInvalidCurrencyReason(code: string): string | null {
  if (typeof code !== 'string' || code.length !== 3 || !/^[A-Z]{3}$/.test(code)) {
    return 'This currency code is not recognized. Enter a valid 3-letter ISO 4217 code.';
  }

  // 1) Check active list — if present and active, the currency is valid.
  if (CURRENCIES.some(c => c.code === code && c.isActive)) {
    return null;
  }

  // 2) Not in active list — fall back to the full list to tell known-but-inactive
  //    from completely unknown codes.
  if (CURRENCIES.some(c => c.code === code)) {
    return `${code} is no longer a valid currency. Please select an active currency.`;
  }

  return 'This currency code is not recognized. Enter a valid 3-letter ISO 4217 code.';
}
