import type { MenuItem, MenuCategory, Table, Ingredient } from '@/types';

export const sampleCategories: Omit<MenuCategory, 'id'>[] = [
  { name: 'Crepes Croustillantes', nameAr: 'كريب مقرمشة', nameFr: 'Crêpes Croustillantes', sortOrder: 1, active: true },
  { name: 'Crepes Françaises', nameAr: 'كريب فرنسية', nameFr: 'Crêpes Françaises', sortOrder: 2, active: true },
  { name: 'Gaufres', nameAr: 'غوفغ', nameFr: 'Gaufres', sortOrder: 3, active: true },
  { name: 'Pancakes', nameAr: 'بان كيك', nameFr: 'Pancakes', sortOrder: 4, active: true },
  { name: 'Crepes Speciales', nameAr: 'كريب خاصة', nameFr: 'Crêpes Spéciales', sortOrder: 5, active: true },
  { name: 'Pancake Burger', nameAr: 'بان كيك برغر', nameFr: 'Pancake Burger', sortOrder: 6, active: true },
  { name: 'Assiettes', nameAr: 'أطباق حصرية', nameFr: 'Assiettes', sortOrder: 7, active: true },
  { name: 'Boissons Chaudes', nameAr: 'مشروبات ساخنة', nameFr: 'Boissons Chaudes', sortOrder: 8, active: true },
  { name: 'Ice Coffee', nameAr: 'آيس كوفي', nameFr: 'Ice Coffee', sortOrder: 9, active: true },
  { name: 'Milk Shake', nameAr: 'ميلك شيك', nameFr: 'Milk Shake', sortOrder: 10, active: true },
  { name: 'Jus Presses', nameAr: 'عصائر طبيعية', nameFr: 'Jus Pressés', sortOrder: 11, active: true },
  { name: 'Mojitos', nameAr: 'موخيتو', nameFr: 'Mojitos', sortOrder: 12, active: true },
  { name: 'Mixologie', nameAr: 'ميكسولوجي', nameFr: 'Mixologie', sortOrder: 13, active: true },
  { name: 'Fait Maison', nameAr: 'صنع منزلي', nameFr: 'Fait Maison', sortOrder: 14, active: true },
];

export const sampleMenuItems: Omit<MenuItem, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[] = [
  // --- Crêpes Croustillantes ---
  { name: 'Chocolat C', nameAr: 'شوكولا C', nameFr: 'Chocolat C', price: 350, costPrice: 80, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,chocolat', barcode: 'CRP-C01' },
  { name: 'Banane C', nameAr: 'بانان C', nameFr: 'Banane C', price: 450, costPrice: 100, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,banane', barcode: 'CRP-C02' },
  { name: 'Noix C', nameAr: 'جوز C', nameFr: 'Noix C', price: 550, costPrice: 120, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,noix', barcode: 'CRP-C03' },
  { name: 'Fruita C', nameAr: 'فواكه C', nameFr: 'Fruita C', price: 600, costPrice: 150, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,fruita', barcode: 'CRP-C04' },
  { name: 'Lotus C', nameAr: 'لوتس C', nameFr: 'Lotus C', price: 650, costPrice: 160, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,lotus', barcode: 'CRP-C05' },
  { name: 'Pistache C', nameAr: 'بيستاش C', nameFr: 'Pistache C', price: 700, costPrice: 180, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,pistache', barcode: 'CRP-C06' },
  { name: 'Crepettoo C', nameAr: 'كريبوتو C', nameFr: 'Crepettoo C', price: 750, costPrice: 200, available: true, prepTimeMin: 8, tags: 'crepe,croustillante,crepettoo', barcode: 'CRP-C07' },

  // --- Crêpes Françaises ---
  { name: 'Chocolat F', nameAr: 'شوكولا F', nameFr: 'Chocolat F', price: 350, costPrice: 80, available: true, prepTimeMin: 8, tags: 'crepe,francaise,chocolat', barcode: 'CRP-F01' },
  { name: 'Banane F', nameAr: 'بانان F', nameFr: 'Banane F', price: 450, costPrice: 100, available: true, prepTimeMin: 8, tags: 'crepe,francaise,banane', barcode: 'CRP-F02' },
  { name: 'Noix F', nameAr: 'جوز F', nameFr: 'Noix F', price: 550, costPrice: 120, available: true, prepTimeMin: 8, tags: 'crepe,francaise,noix', barcode: 'CRP-F03' },
  { name: 'Fruita F', nameAr: 'فواكه F', nameFr: 'Fruita F', price: 600, costPrice: 150, available: true, prepTimeMin: 8, tags: 'crepe,francaise,fruita', barcode: 'CRP-F04' },
  { name: 'Lotus F', nameAr: 'لوتس F', nameFr: 'Lotus F', price: 650, costPrice: 160, available: true, prepTimeMin: 8, tags: 'crepe,francaise,lotus', barcode: 'CRP-F05' },
  { name: 'Pistache F', nameAr: 'بيستاش F', nameFr: 'Pistache F', price: 700, costPrice: 180, available: true, prepTimeMin: 8, tags: 'crepe,francaise,pistache', barcode: 'CRP-F06' },
  { name: 'Crepettoo F', nameAr: 'كريبوتو F', nameFr: 'Crepettoo F', price: 750, costPrice: 200, available: true, prepTimeMin: 8, tags: 'crepe,francaise,crepettoo', barcode: 'CRP-F07' },

  // --- Gaufres ---
  { name: 'Chocolat Gaufre', nameAr: 'شوكولا غوفغ', nameFr: 'Chocolat', price: 350, costPrice: 80, available: true, prepTimeMin: 8, tags: 'gaufre,chocolat', barcode: 'GAU001' },
  { name: 'Banane Gaufre', nameAr: 'بانان غوفغ', nameFr: 'Banane', price: 450, costPrice: 100, available: true, prepTimeMin: 8, tags: 'gaufre,banane', barcode: 'GAU002' },
  { name: 'Noix Gaufre', nameAr: 'جوز غوفغ', nameFr: 'Noix', price: 550, costPrice: 120, available: true, prepTimeMin: 8, tags: 'gaufre,noix', barcode: 'GAU003' },
  { name: 'Fruita Gaufre', nameAr: 'فواكه غوفغ', nameFr: 'Fruita', price: 600, costPrice: 150, available: true, prepTimeMin: 8, tags: 'gaufre,fruita', barcode: 'GAU004' },
  { name: 'Lotus Gaufre', nameAr: 'لوتس غوفغ', nameFr: 'Lotus', price: 650, costPrice: 160, available: true, prepTimeMin: 8, tags: 'gaufre,lotus', barcode: 'GAU005' },
  { name: 'Pistache Gaufre', nameAr: 'بيستاش غوفغ', nameFr: 'Pistache', price: 700, costPrice: 180, available: true, prepTimeMin: 8, tags: 'gaufre,pistache', barcode: 'GAU006' },
  { name: 'Crepettoo Gaufre', nameAr: 'كريبوتو غوفغ', nameFr: 'Crepettoo', price: 750, costPrice: 200, available: true, prepTimeMin: 8, tags: 'gaufre,crepettoo', barcode: 'GAU007' },

  // --- Pancakes ---
  { name: 'Chocolat Pancake', nameAr: 'شوكولا بان كيك', nameFr: 'Chocolat', price: 350, costPrice: 80, available: true, prepTimeMin: 8, tags: 'pancake,chocolat', barcode: 'PAN001' },
  { name: 'Banane Pancake', nameAr: 'بانان بان كيك', nameFr: 'Banane', price: 450, costPrice: 100, available: true, prepTimeMin: 8, tags: 'pancake,banane', barcode: 'PAN002' },
  { name: 'Noix Pancake', nameAr: 'جوز بان كيك', nameFr: 'Noix', price: 550, costPrice: 120, available: true, prepTimeMin: 8, tags: 'pancake,noix', barcode: 'PAN003' },
  { name: 'Fruita Pancake', nameAr: 'فواكه بان كيك', nameFr: 'Fruita', price: 600, costPrice: 150, available: true, prepTimeMin: 8, tags: 'pancake,fruita', barcode: 'PAN004' },
  { name: 'Lotus Pancake', nameAr: 'لوتس بان كيك', nameFr: 'Lotus', price: 650, costPrice: 160, available: true, prepTimeMin: 8, tags: 'pancake,lotus', barcode: 'PAN005' },
  { name: 'Pistache Pancake', nameAr: 'بيستاش بان كيك', nameFr: 'Pistache', price: 700, costPrice: 180, available: true, prepTimeMin: 8, tags: 'pancake,pistache', barcode: 'PAN006' },
  { name: 'Crepettoo Pancake', nameAr: 'كريبوتو بان كيك', nameFr: 'Crepettoo', price: 750, costPrice: 200, available: true, prepTimeMin: 8, tags: 'pancake,crepettoo', barcode: 'PAN007' },

  // --- Crêpes Spéciales ---
  { name: 'Sushi Banane', nameAr: 'سوشي بانان', nameFr: 'Sushi Banane', price: 600, costPrice: 140, available: true, prepTimeMin: 10, tags: 'crepe,speciale,sushi', barcode: 'CSP001' },
  { name: 'Sushi Fruit', nameAr: 'سوشي فواكه', nameFr: 'Sushi Fruit', price: 600, costPrice: 150, available: true, prepTimeMin: 10, tags: 'crepe,speciale,sushi', barcode: 'CSP002' },
  { name: 'Crêpe Roulée', nameAr: 'كريب رولي', nameFr: 'Crêpe Roulée', price: 600, costPrice: 140, available: true, prepTimeMin: 10, tags: 'crepe,speciale,roulee', barcode: 'CSP003' },
  { name: 'Salade César Sucrée', nameAr: 'سلاطة سيزر حلوة', nameFr: 'Salade César Sucrée', price: 650, costPrice: 160, available: true, prepTimeMin: 10, tags: 'crepe,speciale,salade', barcode: 'CSP004' },
  { name: 'Crêpe Madame', nameAr: 'كريب مدام', nameFr: 'Crêpe Madame', price: 650, costPrice: 160, available: true, prepTimeMin: 10, tags: 'crepe,speciale,madame', barcode: 'CSP005' },

  // --- Pancake Burger ---
  { name: 'Burger Chocolat', nameAr: 'برغر شوكولا', nameFr: 'Burger Chocolat', price: 650, costPrice: 150, available: true, prepTimeMin: 10, tags: 'burger,chocolat', barcode: 'BUR001' },
  { name: 'Burger Lotus', nameAr: 'برغر لوتس', nameFr: 'Burger Lotus', price: 700, costPrice: 170, available: true, prepTimeMin: 10, tags: 'burger,lotus', barcode: 'BUR002' },
  { name: 'Burger Pistache', nameAr: 'برغر بيستاش', nameFr: 'Burger Pistache', price: 750, costPrice: 190, available: true, prepTimeMin: 10, tags: 'burger,pistache', barcode: 'BUR003' },

  // --- Assiettes ---
  { name: 'Brownie', nameAr: 'براوني', nameFr: 'Brownie', price: 550, costPrice: 130, available: true, prepTimeMin: 5, tags: 'assiette,brownie', barcode: 'AST001' },
  { name: 'Assiette Fruita', nameAr: 'فواكه', nameFr: 'Fruita', price: 600, costPrice: 150, available: true, prepTimeMin: 5, tags: 'assiette,fruita', barcode: 'AST002' },
  { name: 'Assiette Lotus', nameAr: 'لوتس', nameFr: 'Lotus', price: 650, costPrice: 160, available: true, prepTimeMin: 5, tags: 'assiette,lotus', barcode: 'AST003' },
  { name: 'Assiette Chocolat', nameAr: 'شوكولا', nameFr: 'Chocolat', price: 550, costPrice: 130, available: true, prepTimeMin: 5, tags: 'assiette,chocolat', barcode: 'AST004' },
  { name: 'Assiette Pistache', nameAr: 'بيستاش', nameFr: 'Pistache', price: 700, costPrice: 180, available: true, prepTimeMin: 5, tags: 'assiette,pistache', barcode: 'AST005' },
  { name: 'Infinity', nameAr: 'إينفينيتي', nameFr: 'Infinity', price: 700, costPrice: 180, available: true, prepTimeMin: 8, tags: 'assiette,infinity', barcode: 'AST006' },
  { name: 'Magique', nameAr: 'ماجيك', nameFr: 'Magique', price: 750, costPrice: 200, available: true, prepTimeMin: 8, tags: 'assiette,magique', barcode: 'AST007' },

  // --- Boissons Chaudes ---
  { name: 'Café simple', nameAr: 'قهوة عادية', nameFr: 'Café simple', price: 100, costPrice: 20, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH001' },
  { name: 'Américain', nameAr: 'أمريكانو', nameFr: 'Américain', price: 150, costPrice: 30, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH002' },
  { name: 'Lipton', nameAr: 'ليبوتون', nameFr: 'Lipton', price: 150, costPrice: 30, available: true, prepTimeMin: 3, tags: 'boisson,chaude,the', barcode: 'BCH003' },
  { name: 'Noisette / Caramel', nameAr: 'بندق / كراميل', nameFr: 'Noisette / Caramel', price: 200, costPrice: 45, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH004' },
  { name: 'Maxwell', nameAr: 'ماكسويل', nameFr: 'Maxwell', price: 200, costPrice: 45, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH005' },
  { name: 'Capsule', nameAr: 'كبسولة', nameFr: 'Capsule', price: 250, costPrice: 70, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH006' },
  { name: 'Lait', nameAr: 'حليب', nameFr: 'Lait', price: 100, costPrice: 25, available: true, prepTimeMin: 2, tags: 'boisson,chaude,lait', barcode: 'BCH007' },
  { name: 'Café au lait', nameAr: 'قهوة بالحليب', nameFr: 'Café au lait', price: 150, costPrice: 35, available: true, prepTimeMin: 3, tags: 'boisson,chaude,cafe', barcode: 'BCH008' },
  { name: 'Cappuccino', nameAr: 'كابوتشينو', nameFr: 'Cappuccino', price: 200, costPrice: 50, available: true, prepTimeMin: 4, tags: 'boisson,chaude,cafe', barcode: 'BCH009' },
  { name: 'Lait chocolat', nameAr: 'حليب شوكولا', nameFr: 'Lait chocolat', price: 200, costPrice: 50, available: true, prepTimeMin: 4, tags: 'boisson,chaude,chocolat', barcode: 'BCH010' },
  { name: 'Mocha', nameAr: 'موكا', nameFr: 'Mocha', price: 300, costPrice: 70, available: true, prepTimeMin: 4, tags: 'boisson,chaude,mocha', barcode: 'BCH011' },
  { name: 'Hot Chocolate', nameAr: 'شوكولا ساخنة', nameFr: 'Hot Chocolate', price: 450, costPrice: 120, available: true, prepTimeMin: 5, tags: 'boisson,chaude,chocolat', barcode: 'BCH012' },

  // --- Ice Coffee ---
  { name: 'Ice Coffee Classique', nameAr: 'آيس كوفي كلاسيك', nameFr: 'Classique', price: 350, costPrice: 80, available: true, prepTimeMin: 4, tags: 'ice,coffee,classique', barcode: 'ICO001' },
  { name: 'Ice Coffee Vanille', nameAr: 'آيس كوفي فانيلا', nameFr: 'Vanille', price: 400, costPrice: 90, available: true, prepTimeMin: 4, tags: 'ice,coffee,vanille', barcode: 'ICO002' },
  { name: 'Ice Coffee Chocolat', nameAr: 'آيس كوفي شوكولا', nameFr: 'Chocolat', price: 450, costPrice: 100, available: true, prepTimeMin: 4, tags: 'ice,coffee,chocolat', barcode: 'ICO003' },

  // --- Milk Shake ---
  { name: 'Milk Shake Banane', nameAr: 'ميلك شيك بانان', nameFr: 'Banane', price: 400, costPrice: 90, available: true, prepTimeMin: 5, tags: 'milkshake,banane', barcode: 'MSH001' },
  { name: 'Milk Shake Choco', nameAr: 'ميلك شيك شوكو', nameFr: 'Choco', price: 450, costPrice: 100, available: true, prepTimeMin: 5, tags: 'milkshake,choco', barcode: 'MSH002' },
  { name: 'Milk Shake Vanille', nameAr: 'ميلك شيك فانيلا', nameFr: 'Vanille', price: 400, costPrice: 90, available: true, prepTimeMin: 5, tags: 'milkshake,vanille', barcode: 'MSH003' },
  { name: 'Milk Shake Choco / Vanille', nameAr: 'ميلك شيك شوكو / فانيلا', nameFr: 'Choco / Vanille', price: 500, costPrice: 120, available: true, prepTimeMin: 5, tags: 'milkshake,mix', barcode: 'MSH004' },
  { name: 'Milk Shake Fraise', nameAr: 'ميلك شيك فريز', nameFr: 'Fraise', price: 500, costPrice: 120, available: true, prepTimeMin: 5, tags: 'milkshake,fraise', barcode: 'MSH005' },
  { name: 'Milk Shake Lotus', nameAr: 'ميلك شيك لوتس', nameFr: 'Lotus', price: 600, costPrice: 140, available: true, prepTimeMin: 5, tags: 'milkshake,lotus', barcode: 'MSH006' },
  { name: 'Milk Shake Chocolat Banane', nameAr: 'ميلك شيك شوكولا بانان', nameFr: 'Chocolat Banane', price: 650, costPrice: 150, available: true, prepTimeMin: 5, tags: 'milkshake,chocolat,banane', barcode: 'MSH007' },

  // --- Jus Pressés ---
  { name: 'Citron', nameAr: 'ليمون', nameFr: 'Citron', price: 350, costPrice: 70, available: true, prepTimeMin: 4, tags: 'jus,citron', barcode: 'JUS001' },
  { name: 'Orange', nameAr: 'برتقال', nameFr: 'Orange', price: 400, costPrice: 90, available: true, prepTimeMin: 4, tags: 'jus,orange', barcode: 'JUS002' },
  { name: 'Banane Jus', nameAr: 'بانان', nameFr: 'Banane', price: 400, costPrice: 90, available: true, prepTimeMin: 4, tags: 'jus,banane', barcode: 'JUS003' },
  { name: 'Pêche', nameAr: 'خوخ', nameFr: 'Pêche', price: 400, costPrice: 90, available: true, prepTimeMin: 4, tags: 'jus,peche', barcode: 'JUS004' },
  { name: 'Fraise Jus', nameAr: 'فريز', nameFr: 'Fraise', price: 450, costPrice: 110, available: true, prepTimeMin: 4, tags: 'jus,fraise', barcode: 'JUS005' },
  { name: 'Cocktail', nameAr: 'كوكتيل', nameFr: 'Cocktail', price: 500, costPrice: 130, available: true, prepTimeMin: 5, tags: 'jus,cocktail', barcode: 'JUS006' },
  { name: 'Salade de fruits', nameAr: 'سلاطة فواكه', nameFr: 'Salade de fruits', price: 600, costPrice: 160, available: true, prepTimeMin: 6, tags: 'dessert,salade,fruits', barcode: 'JUS007' },

  // --- Mojitos ---
  { name: 'Mojito Classique', nameAr: 'موخيتو كلاسيك', nameFr: 'Classique', price: 400, costPrice: 90, available: true, prepTimeMin: 4, tags: 'mojito,classique', barcode: 'MOJ001' },
  { name: 'Mojito Fraise / Framboise / Bleu', nameAr: 'موخيتو فريز / فرامبواز / أزرق', nameFr: 'Fraise / Framboise / Bleu', price: 500, costPrice: 120, available: true, prepTimeMin: 4, tags: 'mojito,fruits', barcode: 'MOJ002' },
  { name: 'Mojito Energy', nameAr: 'موخيتو إينيرجي', nameFr: 'Energy', price: 600, costPrice: 180, available: true, prepTimeMin: 4, tags: 'mojito,energy', barcode: 'MOJ003' },

  // --- Mixologie ---
  { name: 'The Dark', nameAr: 'ذا دارك', nameFr: 'The Dark', price: 550, costPrice: 140, available: true, prepTimeMin: 5, tags: 'mixologie,thedark', barcode: 'MIX001' },
  { name: 'Blue Iceberg', nameAr: 'بلو آيسبيرغ', nameFr: 'Blue Iceberg', price: 500, costPrice: 120, available: true, prepTimeMin: 5, tags: 'mixologie,blueiceberg', barcode: 'MIX002' },
  { name: 'Pina Colada', nameAr: 'بينا كولادا', nameFr: 'Pina Colada', price: 600, costPrice: 150, available: true, prepTimeMin: 5, tags: 'mixologie,pinacolada', barcode: 'MIX003' },

  // --- Fait Maison ---
  { name: 'Cheesecake', nameAr: 'تشيز كيك', nameFr: 'Cheesecake', price: 500, costPrice: 130, available: true, prepTimeMin: 2, tags: 'fait,maison,cheesecake', barcode: 'HOM001' },
  { name: 'San Sebastián Choco', nameAr: 'سان سيباستيان شوكولا', nameFr: 'San Sebastián Choco', price: 450, costPrice: 110, available: true, prepTimeMin: 2, tags: 'fait,maison,sansebastian', barcode: 'HOM002' },
  { name: 'Tiramisu classique', nameAr: 'تيراميسو كلاسيك', nameFr: 'Tiramisu classique', price: 500, costPrice: 130, available: true, prepTimeMin: 2, tags: 'fait,maison,tiramisu', barcode: 'HOM003' },
  { name: 'Tiramisu au choix', nameAr: 'تيراميسو حسب الاختيار', nameFr: 'Tiramisu au choix', price: 600, costPrice: 150, available: true, prepTimeMin: 2, tags: 'fait,maison,tiramisu', barcode: 'HOM004' },
  { name: 'Cake Dubaï', nameAr: 'كيك دبي', nameFr: 'Cake Dubaï', price: 450, costPrice: 120, available: true, prepTimeMin: 2, tags: 'fait,maison,dubai', barcode: 'HOM005' },
];

export const sampleIngredients: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Farine', nameAr: 'طحين', unit: 'كغ', stock: 20, minStock: 5, costPerUnit: 80 },
  { name: 'Nutella', nameAr: 'نوتيلا', unit: 'كغ', stock: 5, minStock: 2, costPerUnit: 400 },
  { name: 'Chocolat', nameAr: 'شوكولاتة', unit: 'كغ', stock: 10, minStock: 2, costPerUnit: 600 },
  { name: 'Lait', nameAr: 'حليب', unit: 'لتر', stock: 15, minStock: 5, costPerUnit: 120 },
  { name: 'Oeufs', nameAr: 'بيض', unit: 'قطعة', stock: 60, minStock: 20, costPerUnit: 15 },
  { name: 'Sucre', nameAr: 'سكر', unit: 'كغ', stock: 10, minStock: 3, costPerUnit: 100 },
];

export const sampleTables: { number: number; name?: string; capacity: number; zone: string }[] = [
  { number: 1, name: 'T1', capacity: 2, zone: 'interieur' },
  { number: 2, name: 'T2', capacity: 2, zone: 'interieur' },
  { number: 3, name: 'T3', capacity: 4, zone: 'interieur' },
  { number: 4, name: 'T4', capacity: 4, zone: 'interieur' },
  { number: 5, name: 'T5', capacity: 6, zone: 'interieur' },
  { number: 6, name: 'Terrasse 1', capacity: 4, zone: 'terrasse' },
  { number: 7, name: 'Terrasse 2', capacity: 4, zone: 'terrasse' },
  { number: 8, name: 'Terrasse 3', capacity: 6, zone: 'terrasse' },
  { number: 9, name: 'Terrasse 4', capacity: 2, zone: 'terrasse' },
  { number: 10, name: 'VIP', capacity: 8, zone: 'vip' },
];