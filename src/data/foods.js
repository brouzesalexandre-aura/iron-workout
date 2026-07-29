/* ---------- Base d'aliments (pour 100 g sauf portion) ---------- */
const FOODS = [
  // Protéines
  {id:'f_poulet',name:'Poulet (blanc, cuit)',cat:'Protéine',kcal:165,p:31,c:0,f:3.6,portion:{g:120,label:'1 filet'}},
  {id:'f_dinde',name:'Dinde (escalope)',cat:'Protéine',kcal:135,p:29,c:0,f:1.5,portion:{g:100,label:'1 escalope'}},
  {id:'f_boeuf5',name:'Bœuf haché 5%',cat:'Protéine',kcal:137,p:21,c:0,f:5,portion:{g:125,label:'1 steak'}},
  {id:'f_saumon',name:'Saumon',cat:'Protéine',kcal:208,p:20,c:0,f:13,portion:{g:130,label:'1 pavé'}},
  {id:'f_thon',name:'Thon (au naturel)',cat:'Protéine',kcal:116,p:26,c:0,f:1,portion:{g:80,label:'1 boîte'}},
  {id:'f_oeuf',name:'Œuf',cat:'Protéine',kcal:143,p:13,c:1.1,f:9.5,portion:{g:55,label:'1 œuf'}},
  {id:'f_blanc_oeuf',name:'Blanc d\'œuf',cat:'Protéine',kcal:52,p:11,c:0.7,f:0.2,portion:{g:33,label:'1 blanc'}},
  {id:'f_crevette',name:'Crevettes',cat:'Protéine',kcal:99,p:24,c:0.2,f:0.3,portion:{g:100,label:'100 g'}},
  {id:'f_tofu',name:'Tofu ferme',cat:'Protéine',kcal:144,p:16,c:2,f:9,portion:{g:100,label:'100 g'}},
  {id:'f_jambon',name:'Jambon blanc',cat:'Protéine',kcal:107,p:18,c:1,f:3.5,portion:{g:40,label:'1 tranche'}},
  // Laitages
  {id:'f_fromageblanc',name:'Fromage blanc 0%',cat:'Laitage',kcal:47,p:8,c:4,f:0.2,portion:{g:100,label:'1 pot'}},
  {id:'f_skyr',name:'Skyr nature',cat:'Laitage',kcal:63,p:11,c:4,f:0.2,portion:{g:150,label:'1 pot'}},
  {id:'f_yaourtgrec',name:'Yaourt grec',cat:'Laitage',kcal:97,p:9,c:4,f:5,portion:{g:150,label:'1 pot'}},
  {id:'f_lait',name:'Lait demi-écrémé',cat:'Laitage',kcal:47,p:3.3,c:4.8,f:1.6,portion:{g:250,label:'1 verre'}},
  {id:'f_comte',name:'Comté',cat:'Laitage',kcal:410,p:27,c:0,f:34,portion:{g:30,label:'1 part'}},
  {id:'f_mozza',name:'Mozzarella',cat:'Laitage',kcal:280,p:22,c:2,f:20,portion:{g:125,label:'1 boule'}},
  // Féculents
  {id:'f_riz',name:'Riz (cuit)',cat:'Féculent',kcal:130,p:2.7,c:28,f:0.3,portion:{g:150,label:'1 bol'}},
  {id:'f_pates',name:'Pâtes (cuites)',cat:'Féculent',kcal:158,p:6,c:31,f:0.9,portion:{g:150,label:'1 assiette'}},
  {id:'f_patate',name:'Pomme de terre',cat:'Féculent',kcal:87,p:2,c:20,f:0.1,portion:{g:150,label:'2 moyennes'}},
  {id:'f_patatedouce',name:'Patate douce',cat:'Féculent',kcal:86,p:1.6,c:20,f:0.1,portion:{g:150,label:'1 moyenne'}},
  {id:'f_avoine',name:'Flocons d\'avoine',cat:'Féculent',kcal:379,p:13,c:67,f:7,portion:{g:60,label:'1 bol'}},
  {id:'f_pain',name:'Pain complet',cat:'Féculent',kcal:247,p:9,c:41,f:3.4,portion:{g:40,label:'1 tranche'}},
  {id:'f_semoule',name:'Semoule (cuite)',cat:'Féculent',kcal:112,p:3.8,c:23,f:0.2,portion:{g:150,label:'1 bol'}},
  {id:'f_lentilles',name:'Lentilles (cuites)',cat:'Féculent',kcal:116,p:9,c:20,f:0.4,portion:{g:150,label:'1 bol'}},
  {id:'f_quinoa',name:'Quinoa (cuit)',cat:'Féculent',kcal:120,p:4.4,c:21,f:1.9,portion:{g:150,label:'1 bol'}},
  // Fruits & légumes
  {id:'f_banane',name:'Banane',cat:'Fruit',kcal:89,p:1.1,c:23,f:0.3,portion:{g:120,label:'1 banane'}},
  {id:'f_pomme',name:'Pomme',cat:'Fruit',kcal:52,p:0.3,c:14,f:0.2,portion:{g:150,label:'1 pomme'}},
  {id:'f_fraise',name:'Fraises',cat:'Fruit',kcal:32,p:0.7,c:7.7,f:0.3,portion:{g:150,label:'1 bol'}},
  {id:'f_myrtille',name:'Myrtilles',cat:'Fruit',kcal:57,p:0.7,c:14,f:0.3,portion:{g:100,label:'1 poignée'}},
  {id:'f_brocoli',name:'Brocoli',cat:'Légume',kcal:34,p:2.8,c:7,f:0.4,portion:{g:150,label:'1 portion'}},
  {id:'f_haricot',name:'Haricots verts',cat:'Légume',kcal:31,p:1.8,c:7,f:0.1,portion:{g:150,label:'1 portion'}},
  {id:'f_epinard',name:'Épinards',cat:'Légume',kcal:23,p:2.9,c:3.6,f:0.4,portion:{g:100,label:'1 portion'}},
  {id:'f_tomate',name:'Tomate',cat:'Légume',kcal:18,p:0.9,c:3.9,f:0.2,portion:{g:120,label:'1 tomate'}},
  {id:'f_avocat',name:'Avocat',cat:'Légume',kcal:160,p:2,c:9,f:15,portion:{g:100,label:'1/2 avocat'}},
  // Lipides & oléagineux
  {id:'f_huile',name:'Huile d\'olive',cat:'Lipide',kcal:884,p:0,c:0,f:100,portion:{g:10,label:'1 c. à soupe'}},
  {id:'f_amande',name:'Amandes',cat:'Lipide',kcal:579,p:21,c:22,f:50,portion:{g:30,label:'1 poignée'}},
  {id:'f_noix',name:'Noix',cat:'Lipide',kcal:654,p:15,c:14,f:65,portion:{g:30,label:'1 poignée'}},
  {id:'f_pb',name:'Beurre de cacahuète',cat:'Lipide',kcal:588,p:25,c:20,f:50,portion:{g:20,label:'1 c. à soupe'}},
  {id:'f_beurre',name:'Beurre',cat:'Lipide',kcal:717,p:0.9,c:0.1,f:81,portion:{g:10,label:'1 noisette'}},
  // Compléments / autres
  {id:'f_whey',name:'Whey (protéine)',cat:'Complément',kcal:400,p:80,c:8,f:6,portion:{g:30,label:'1 dose'}},
  {id:'f_miel',name:'Miel',cat:'Autre',kcal:304,p:0.3,c:82,f:0,portion:{g:20,label:'1 c. à soupe'}},
  {id:'f_choco',name:'Chocolat noir 70%',cat:'Autre',kcal:598,p:8,c:46,f:43,portion:{g:20,label:'2 carrés'}},
  {id:'f_pizza',name:'Pizza',cat:'Autre',kcal:266,p:11,c:33,f:10,portion:{g:300,label:'1 pizza'}},
];
const FOODMAP = Object.fromEntries(FOODS.map(f => [f.id, f]));

/* ---------- Recettes ---------- */
const RECIPES_SEED = [
  {id:'r_bowl',name:'Bowl poulet-riz protéiné',emoji:'🍚',serv:1,tags:['Prise de masse','Rapide'],
    ing:[['f_poulet',150],['f_riz',200],['f_brocoli',150],['f_huile',10]],
    steps:['Cuire le riz et le brocoli à la vapeur.','Poêler le poulet avec l\'huile d\'olive.','Assembler le bowl, assaisonner.']},
  {id:'r_oats',name:'Porridge avoine-banane',emoji:'🥣',serv:1,tags:['Petit-déj'],
    ing:[['f_avoine',60],['f_lait',250],['f_banane',120],['f_pb',20]],
    steps:['Chauffer les flocons dans le lait 3 min.','Ajouter la banane écrasée et le beurre de cacahuète.']},
  {id:'r_omelette',name:'Omelette 3 œufs jambon',emoji:'🍳',serv:1,tags:['Rapide','Sèche'],
    ing:[['f_oeuf',165],['f_jambon',80],['f_epinard',50]],
    steps:['Battre les œufs.','Faire revenir jambon et épinards.','Verser les œufs, cuire à feu doux.']},
  {id:'r_skyr',name:'Skyr fruits & amandes',emoji:'🫐',serv:1,tags:['Collation','Sèche'],
    ing:[['f_skyr',150],['f_myrtille',100],['f_amande',30],['f_miel',20]],
    steps:['Mélanger le skyr et le miel.','Ajouter myrtilles et amandes concassées.']},
  {id:'r_saumon',name:'Saumon patate douce',emoji:'🐟',serv:1,tags:['Équilibré'],
    ing:[['f_saumon',130],['f_patatedouce',200],['f_haricot',150],['f_huile',10]],
    steps:['Rôtir la patate douce au four.','Cuire le saumon 12 min.','Servir avec les haricots verts.']},
  {id:'r_shake',name:'Shake masse post-training',emoji:'🥤',serv:1,tags:['Prise de masse','Rapide'],
    ing:[['f_whey',30],['f_banane',120],['f_avoine',40],['f_pb',20],['f_lait',250]],
    steps:['Mixer tous les ingrédients.','Boire dans les 30 min après la séance.']},
];

/* ---------- Plans de repas types ---------- */
const MEALPLANS_SEED = [
  {id:'p_masse',name:'Prise de masse ~2800 kcal',goal:'Prise de masse',
    meals:[ {name:'Petit-déj',items:[['recipe','r_oats',1]]},
            {name:'Déjeuner',items:[['recipe','r_bowl',1]]},
            {name:'Collation',items:[['recipe','r_shake',1]]},
            {name:'Dîner',items:[['food','f_boeuf5',150],['food','f_pates',200],['food','f_huile',10]]} ]},
  {id:'p_seche',name:'Sèche ~1900 kcal',goal:'Sèche',
    meals:[ {name:'Petit-déj',items:[['recipe','r_omelette',1]]},
            {name:'Déjeuner',items:[['food','f_poulet',150],['food','f_riz',150],['food','f_brocoli',150]]},
            {name:'Collation',items:[['recipe','r_skyr',1]]},
            {name:'Dîner',items:[['food','f_thon',80],['food','f_epinard',150],['food','f_oeuf',110]]} ]},
  {id:'p_equilibre',name:'Équilibré ~2300 kcal',goal:'Maintien',
    meals:[ {name:'Petit-déj',items:[['food','f_avoine',60],['food','f_fromageblanc',150],['food','f_banane',120]]},
            {name:'Déjeuner',items:[['recipe','r_saumon',1]]},
            {name:'Collation',items:[['food','f_pomme',150],['food','f_amande',30]]},
            {name:'Dîner',items:[['food','f_poulet',130],['food','f_quinoa',150],['food','f_haricot',150]]} ]},
];
