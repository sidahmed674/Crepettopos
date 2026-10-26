import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ItemTuple = [fr: string, ar: string, price: number, desc?: string];

interface MenuSection {
  key: string;
  fr: string;
  ar: string;
  code: string;
  items: ItemTuple[];
}

const MENU: MenuSection[] = [
  {
    key: 'Nos Mojitos',
    fr: 'Nos Mojitos',
    ar: 'الموهيتو',
    code: 'MOJ',
    items: [
      ['Classic', 'موهيتو كلاسيك', 350],
      ['Framboise', 'موهيتو فرامبوز', 450],
      ['Blue Mojito', 'موهيتو أزرق', 450],
      ['Fraise Mojito', 'موهيتو فراولة', 450],
      ['Energy Mojito', 'موهيتو إينيرجي', 500],
    ],
  },
  {
    key: 'Jus Presses',
    fr: 'Jus Pressés',
    ar: 'العصائر الطبيعية',
    code: 'JUS',
    items: [
      ["Jus de Citron", 'عصير ليمون', 350],
      ['Jus de Banane', 'عصير بنان', 350],
      ["Jus d'Orange", 'عصير برتقال', 400],
      ['Jus de Pêche', 'عصير خوخ', 400],
      ['Jus de Fraise', 'عصير فراولة', 450],
      ['Jus de Cocktail', 'عصير كوكتيل', 500],
      ['Salade de Fruits', 'سلطة فواكه', 450],
    ],
  },
  {
    key: 'Milkshakes & Mixologie',
    fr: 'Milk-shakes & Mixologie',
    ar: 'ميلك شيك وميكسولوجي',
    code: 'MLK',
    items: [
      ['Banane', 'ميلك شيك بنان', 350],
      ['Vanille', 'ميلك شيك فانيليا', 350],
      ['Choco / Vanille', 'ميلك شيك شوكولا/فانيليا', 400],
      ['Fraise', 'ميلك شيك فراولة', 400],
      ['Chocolat', 'ميلك شيك شوكولا', 450],
      ['Lotus', 'ميلك شيك لوتس', 450],
      ['Chocolat Banane', 'ميلك شيك شوكولا بنان', 500],
      ['Brownie', 'ميلك شيك براوني', 500],
      ['Milkshake Healthy', 'ميلك شيك صحي', 500],
      ['Tropical', 'ميلك شيك استوائي', 450],
      ['The Dark', 'ذا دارك', 450],
      ['Pink Colada', 'بينك كولادا', 450],
      ['Bleu Iceberg', 'بلو آيسبيرغ', 450],
      ['Piña Colada', 'بينا كولادا', 500],
    ],
  },
  {
    key: 'Boissons Chaudes & Cafe',
    fr: 'Boissons Chaudes & Café',
    ar: 'المشروبات الساخنة والقهوة',
    code: 'CAF',
    items: [
      ['Café Simple', 'قهوة سادة', 100],
      ['Américaino', 'أمريكانو', 150],
      ['Thé Lipton', 'شاي ليبتون', 150],
      ['Café (Noisette / Caramel)', 'قهوة بندق/كراميل', 200],
      ['Café Maxwell', 'قهوة ماكسويل', 200],
      ['Café Bombo', 'قهوة بومبو', 150],
      ["Café (l'Or / Caps)", 'قهوة لور/كبسولات', 200],
      ['Café au Chocolat Noir', 'قهوة بالشوكولا الداكنة', 200],
      ['Nespresso', 'نيسبريسو', 250],
      ['Lait', 'حليب', 100],
      ['Café au Lait', 'قهوة بالحليب', 150],
      ['Cappuccino', 'كابتشينو', 200],
      ['Lait Chocolat', 'حليب بالشوكولا', 200],
      ['Café Mocha', 'كافيه موكا', 250],
      ['Hot Chocolate', 'شوكولا ساخنة', 450],
      ['Iced Coffee Classic', 'آيس كوفي كلاسيك', 350],
      ['Iced Coffee Vanille', 'آيس كوفي فانيليا', 400],
      ['Iced Coffee Caramel', 'آيس كوفي كراميل', 400],
      ['Iced Coffee Chocolat', 'آيس كوفي شوكولا', 450],
    ],
  },
  {
    key: 'Cheesecake & Tiramisu & Mega Crepes',
    fr: 'Cheesecake & Tiramisu & Méga Crêpes',
    ar: 'تشيز كيك وتيراميسو وميجا كريب',
    code: 'CHE',
    items: [
      ['Cheesecake au Choix', 'تشيز كيك حسب الاختيار', 450],
      ['Saint Sébastien Chocolat', 'سان سيباستيان شوكولا', 450],
      ['Saint Sébastien Lotus', 'سان سيباستيان لوتس', 500],
      ['Saint Sébastien Pistachio', 'سان سيباستيان فستاق', 600],
      ['Tiramisu Classique', 'تيراميسو كلاسيك', 500],
      ['Tiramisu au Choix', 'تيراميسو حسب الاختيار', 600],
      ['Tiramisu Mokassirat', 'تيراميسو مقصّرات', 700],
      ['Méga Fruits', 'ميغا فواكه', 3500],
      ['Cour Frais', 'كور فريه', 3500],
      ['Méga Mix', 'ميغا ميكس', 4500],
      ['Méga Crepettoo', 'ميغا كريبتو', 5800],
    ],
  },
  {
    key: 'Assiettes & Crepes Sushi',
    fr: 'Assiettes & Crêpes Sushi',
    ar: 'أطباق وكريب سوشي',
    code: 'SUS',
    items: [
      ['Brownie (Assiette)', 'براوني (طبق)', 450],
      ['Fruita (Assiette)', 'فروتا (طبق)', 500],
      ['Lotus (Assiette)', 'لوتس (طبق)', 550],
      ['Chocolat (Assiette)', 'شوكولا (طبق)', 550],
      ['Infinity (Assiette)', 'إنفينيتي (طبق)', 650],
      ['Pistache (Assiette)', 'فستاق (طبق)', 650],
      ['Magique (Assiette)', 'ماجيك (طبق)', 750],
      ['Sushi Banane', 'سوشي بنان', 550, 'banane + crème maison + tasse chocolat'],
      ['Sushi Brownies', 'سوشي براوني', 600, 'brownie + crème maison + tasse chocolat'],
      ['Sushi Fruit', 'سوشي فواكه', 600, 'fruit + crème maison + tasse chocolat'],
      ['Sushi Kiwi', 'سوشي كيوي', 650, 'kiwi + crème maison + tasse chocolat'],
    ],
  },
  {
    key: 'Pancakes',
    fr: 'Pancakes',
    ar: 'بان كيك',
    code: 'PNK',
    items: [
      ['Miel / Confiture', 'بان كيك عسل/مربى', 250],
      ['Chocolat', 'بان كيك شوكولا', 350],
      ['Beurre de Cacahuète', 'بان كيك زبدة الفول السوداني', 350],
      ['Banane', 'بان كيك بنان', 450],
      ['Mixte Fruits', 'بان كيك فواكه مشكلة', 500],
      ['Délice (Fruits Secs)', 'بان كيك دليس (فواكه جافة)', 550],
      ['Burger Chocolat', 'بان كيك برغر شوكولا', 650],
      ['Burger Lotus', 'بان كيك برغر لوتس', 700],
      ['Burger Pistache', 'بان كيك برغر فستاق', 750],
      ['Pancake Healthy', 'بان كيك صحي', 600],
    ],
  },
  {
    key: 'Gaufres',
    fr: 'Gaufres',
    ar: 'غوفري',
    code: 'GAU',
    items: [
      ['Miel / Confiture', 'غوفري عسل/مربى', 250],
      ['Chocolat', 'غوفري شوكولا', 350],
      ['Banane', 'غوفري بنان', 400],
      ['Fruita', 'غوفري فروتا', 500],
      ['Lotus', 'غوفري لوتس', 500],
      ['Pistachio', 'غوفري فستاق', 650],
      ['Spécial', 'غوفري خاص', 650],
      ['Crepettoo', 'غوفري كريبتو', 750],
    ],
  },
  {
    key: 'Crepes Francaise',
    fr: 'Crêpes Française',
    ar: 'كريب فرنسي',
    code: 'CRF',
    items: [
      ['Confiture', 'كريب فرنسي مربى', 250],
      ['Chocolat', 'كريب فرنسي شوكولا', 350],
      ['Spaghetti', 'كريب سباغيتي', 400],
      ['Roulée', 'كريب رولي', 450],
      ['Banana', 'كريب فرنسي بنان', 450],
      ['Fruita', 'كريب فرنسي فروتا', 500],
      ['Japonaise', 'كريب ياباني', 650],
      ['Pistachio', 'كريب فرنسي فستاق', 700],
      ['Magique', 'كريب فرنسي ماجيك', 750],
    ],
  },
  {
    key: 'Crepes Croustillantes',
    fr: 'Crêpes Croustillantes',
    ar: 'كريب مقرمش',
    code: 'CRC',
    items: [
      ['Chocolat', 'كريب مقرمش شوكولا', 300],
      ['Banane', 'كريب مقرمش بنان', 400],
      ['Ananas', 'كريب مقرمش أناناس', 400],
      ['Fraise', 'كريب مقرمش فراولة', 450],
      ['Fruita (3 Fruits)', 'كريب مقرمش فروتا (3 فواكه)', 450],
      ['Noix', 'كريب مقرمش جوز', 550],
      ['Lotus', 'كريب مقرمش لوتس', 550],
      ['Pistachio', 'كريب مقرمش فستاق', 650],
      ['Crepettoo', 'كريب مقرمش كريبتو', 750],
    ],
  },
  {
    key: 'Menu Dubai',
    fr: 'Menu Dubai',
    ar: 'منيو دبي',
    code: 'DXB',
    items: [
      ['Brownies Dubai', 'براونيز دبي', 450],
      ['Cheesecake Dubai', 'تشيز كيك دبي', 500],
      ['Crêpe Croustillante Dubai', 'كريب مقرمش دبي', 650],
      ['Crêpe Française Dubai', 'كريب فرنسي دبي', 650],
      ['Crêpe Roulée Dubai', 'كريب رولي دبي', 650],
      ['Cake Dubai', 'كيك دبي', 900],
      ['Milkshake Dubai', 'ميلك شيك دبي', 550],
    ],
  },
  {
    key: 'Supplements',
    fr: 'Suppléments',
    ar: 'الإضافات',
    code: 'SUP',
    items: [
      ['Fruits', 'فواكه', 100],
      [
        'Nutella - Boule de glace au choix - Lotus - Chocolat - Pistache - Beurre de cacahuète - Nestlé - Fruits secs',
        'إضافات (نوتيلا/آيس كريم/لوتس/شوكولا/فستاق/زبدة الفول السوداني/نيستله/فواكه جافة)',
        200,
      ],
    ],
  },
];

async function main() {
  console.log('Seeding REAL Crepettoo menu...');
  let itemCount = 0;

  for (let s = 0; s < MENU.length; s++) {
    const section = MENU[s];
    const category = await prisma.menuCategory.upsert({
      where: { name: section.key },
      update: { nameAr: section.ar, nameFr: section.fr, sortOrder: s + 1, active: true },
      create: {
        name: section.key,
        nameAr: section.ar,
        nameFr: section.fr,
        sortOrder: s + 1,
        active: true,
      },
    });

    for (let i = 0; i < section.items.length; i++) {
      const [fr, ar, price, desc] = section.items[i];
      const barcode = `${section.code}${String(i + 1).padStart(3, '0')}`;
      await prisma.menuItem.upsert({
        where: { barcode },
        update: { name: fr, nameAr: ar, nameFr: fr, price, categoryId: category.id, available: true, ...(desc ? { description: desc } : {}) },
        create: {
          name: fr,
          nameAr: ar,
          nameFr: fr,
          price,
          barcode,
          categoryId: category.id,
          available: true,
          ...(desc ? { description: desc } : {}),
        },
      });
      itemCount++;
    }
    console.log(`  [${section.code}] ${section.fr} -> ${section.items.length} items`);
  }

  const totalCats = await prisma.menuCategory.count();
  const totalItems = await prisma.menuItem.count();
  console.log(`Done. Processed ${itemCount} items. DB now has ${totalCats} categories, ${totalItems} items.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
