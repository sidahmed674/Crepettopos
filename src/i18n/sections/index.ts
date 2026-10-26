export { ar as arCommon, fr as frCommon, en as enCommon } from './common';
export { ar as arNav, fr as frNav, en as enNav } from './nav';
export { ar as arAuth, fr as frAuth, en as enAuth } from './auth';
export { ar as arPos, fr as frPos, en as enPos } from './pos';
export { ar as arMenu, fr as frMenu, en as enMenu } from './menu';
export { ar as arKitchen, fr as frKitchen, en as enKitchen } from './kitchen';
export { ar as arTables, fr as frTables, en as enTables } from './tables';
export { ar as arReports, fr as frReports, en as enReports } from './reports';
export { ar as arSettings, fr as frSettings, en as enSettings } from './settings';
export { ar as arIngredients, fr as frIngredients, en as enIngredients } from './ingredients';
export { ar as arReceipt, fr as frReceipt, en as enReceipt } from './receipt';
export { ar as arSales, fr as frSales, en as enSales } from './sales';

import { ar as arCommon, fr as frCommon, en as enCommon } from './common';
import { ar as arNav, fr as frNav, en as enNav } from './nav';
import { ar as arAuth, fr as frAuth, en as enAuth } from './auth';
import { ar as arPos, fr as frPos, en as enPos } from './pos';
import { ar as arMenu, fr as frMenu, en as enMenu } from './menu';
import { ar as arKitchen, fr as frKitchen, en as enKitchen } from './kitchen';
import { ar as arTables, fr as frTables, en as enTables } from './tables';
import { ar as arReports, fr as frReports, en as enReports } from './reports';
import { ar as arSettings, fr as frSettings, en as enSettings } from './settings';
import { ar as arIngredients, fr as frIngredients, en as enIngredients } from './ingredients';
import { ar as arReceipt, fr as frReceipt, en as enReceipt } from './receipt';
import { ar as arSales, fr as frSales, en as enSales } from './sales';

export const ar = { ...arCommon, ...arNav, ...arAuth, ...arPos, ...arMenu, ...arKitchen, ...arTables, ...arReports, ...arSettings, ...arIngredients, ...arReceipt, ...arSales };
export const fr = { ...frCommon, ...frNav, ...frAuth, ...frPos, ...frMenu, ...frKitchen, ...frTables, ...frReports, ...frSettings, ...frIngredients, ...frReceipt, ...frSales };
export const en = { ...enCommon, ...enNav, ...enAuth, ...enPos, ...enMenu, ...enKitchen, ...enTables, ...enReports, ...enSettings, ...enIngredients, ...enReceipt, ...enSales };
