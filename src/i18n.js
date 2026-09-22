/* Locale plumbing.

   Monty is built for Ulaanbaatar, so money and dates must not be formatted
   with a hard-coded 'en-US'. Grouping, day/month order, the document language
   and every layout in styles.css are locale-driven from here.

   English is not stored in a catalogue. `t('bag.remove', 'Remove')` carries its
   own English in the call, so the JSX still reads as English prose and only the
   Mongolian column has to be maintained. An untranslated key falls back to that
   inline English, so a raw key never reaches the screen. */

import { demoStrings } from './catalogue.mjs';

export const SUPPORTED = ['en', 'mn'];

/* Mongolian wording follows the project's own research documents: захиалга for
   an order, очиж авах for collection, борлуулагч for a merchant. Terms the
   Ulaanbaatar market uses in English (QR, pickup code) are left in English. */
const catalogues = {
  en: {},
  mn: {
    // Shell and navigation
    'app.tagline': 'Улаанбаатар · интерактив demo',
    'app.home': 'Monty нүүр хуудас',
    'app.demo': 'Demo',
    'app.bag': 'Таны сагс, {count} зүйл',
    'nav.main': 'Үндсэн цэс',
    'nav.discover': 'Нүүр',
    'nav.saved': 'Хадгалсан',
    'nav.pickups': 'Захиалга',
    'nav.you': 'Та',
    'role.workspace': 'Ажлын хэсэг сонгох',
    'role.customer': 'Хэрэглэгч',
    'role.merchant': 'Борлуулагч',
    'role.admin': 'Удирдлага',

    // Preferences
    'pref.theme': 'Өнгөний горим',
    'pref.theme.system': 'Системийн',
    'pref.theme.light': 'Цайвар',
    'pref.theme.dark': 'Бараан',
    // A language is always named in its own language, so LanguageControl
    // writes 'English' and 'Монгол' directly and neither is a catalogue entry.
    'pref.language': 'Хэл',

    // Categories
    'category.all': 'Бүх хүнс',
    'category.bakery': 'Талх, нарийн боов',
    'category.meals': 'Хоол',
    'category.sweet': 'Амттан',
    'category.drinks': 'Ундаа',
    'category.grocery': 'Хүнсний бараа',

    // Discover
    'home.kicker': 'Сайн байна уу, хөрш өө',
    'home.title.line1': 'Өдрийн сайхан.',
    'home.title.line2': 'Гэрийн ойролцоо.',
    'home.subtitle': 'Өнөөдрийн хүнс. Илүү таатай үнэ.',
    'home.sign': 'Халамжтай хийсэн. Хаях нь хэтэрхий харамсалтай.',
    'home.search.label': 'Хүнс эсвэл дэлгүүр хайх',
    'home.search.placeholder': 'Круассан уу? Бага зэрэг кимбап уу?',
    'home.filter': 'Шүүх ба эрэмбэлэх',
    'home.categories': 'Хүнсний ангилал',
    'home.results.search': 'Таны олсон зүйлс',
    'home.results.all': 'Ойролцоох шинэ олдворууд',
    'home.results.category': 'Ойролцоох {category}',
    'home.results.subtitle': 'Өнөөдөр бага зэрэг баяр баясгалан аваарай.',
    'home.results.count': '{count} олдвор',
    'home.empty.title': 'Хайж байгаа зүйлээ олсонгүй юу?',
    'home.empty.body': 'Өөр хүнс сонгох, явах зайгаа нэмэгдүүлэх, эсвэл хот даяар хайж үзээрэй.',
    'home.empty.action': 'Бүх хүнсийг харах',
    'home.endnote': 'Хүнсний хаягдал багатай сайхан өдөр.',
    'home.endnote.small': 'Жишээ дэлгүүр, зураг, очиж авах хугацаа',
    'home.more': 'Илүү олон олдвор үзэх',
    'home.showing': '{total}-аас {shown} харагдаж байна',

    // Shops near you
    'home.shops.title': 'Ойролцоох дэлгүүрүүд',
    'home.shops.subtitle': 'Хот даяар гэрээт {count} дэлгүүр.',
    'home.shops.map': 'Газрын зураг',
    'home.shops.all': 'Бүх дэлгүүр',
    'home.shops.only': 'Зөвхөн {shop}',
    'shop.walk': 'явганаар {minutes} мин',
    'shop.finds': '{count} олдвор',

    // Offer card and detail
    'offer.view': '{title} харах',
    'offer.save': '{title} хадгалах',
    'offer.unsave': '{title} хадгалахаа болих',
    'offer.discount.featured': 'хямд, гэхдээ яг тэр л амттай',
    'offer.left': '{count} үлдсэн',
    'offer.unavailable': 'Дууссан',
    'offer.paused': 'Түр зогсоосон',
    'offer.back': 'Хүнс рүү буцах',
    'offer.discount.detail': 'Гоё {percent}% хямдрал',
    'offer.away': '{distance} зайд',
    'offer.per.roll': 'ширхэг',
    'offer.per.item': 'ширхэг',
    'offer.description.title': 'Өнөөдөр, хайраар хийсэн',
    'offer.allergens': 'Харшил үүсгэгч',
    'offer.allergens.none': 'Захиалахаасаа өмнө дэлгүүрээс асуугаарай',
    'offer.gentle': 'Яг тэр сайхан хүнс. Арай бага хаягдал.',
    'offer.gentle.photo': 'Зураг нь энэ demo-д зөвхөн жишээ болгон үзүүлэв.',
    'offer.gentle.drawing': 'Зураг биш, зурсан дүрс: энэ дэлгүүр өөрийн зургаа илгээгээгүй байна.',
    'offer.walk': '{place}-аас {distance} зайд · явганаар ойролцоогоор {minutes} минут',
    'offer.warning.paused': 'Энэ бүтээгдэхүүнийг түр зогсоосон байна.',
    'offer.warning.none': 'Үлдэгдэл дууссан. Сагсаа шалгах эсвэл өөр зүйл сонгоно уу.',
    'offer.add': 'Сагсанд нэмэх',
    'offer.quantity': 'Тоо ширхэг',
    'offer.quantity.increase': '{label} нэмэх',
    'offer.quantity.decrease': '{label} хасах',
    'offer.photo.unavailable': '{alt}: зураг ачаалагдсангүй',
    'offer.photo.missing': 'Зураг байхгүй',

    // Bag and checkout
    'bag.back': 'Буцах',
    'bag.title': 'Таны сагс',
    'bag.title.full': 'Таны бяцхан сагс',
    'bag.title.checkout': 'Demo төлбөр',
    'bag.empty.title': 'Сайхан зүйлд зай бий',
    'bag.empty.body': 'Ойролцоох дэлгүүрээс дулаахан талх эсвэл өнөө оройн хоолоо олоорой.',
    'bag.shop.note': 'Нэг дэлгүүр. Нэг удаагийн таатай очилт.',
    'bag.remove': 'Хасах',
    'bag.addmore': '{shop}-аас өөр зүйл нэмэх',
    'bag.pickup': 'Өнөөдөр {start}–{end} цагт очиж авна',
    'bag.error.times': 'Эдгээр зүйлийн очиж авах хугацаа өөр байна. Тусад нь захиална уу.',
    'bag.error.stock': 'Ердөө {count} ширхэг байна.',
    'bag.summary.usual': 'Үндсэн үнэ',
    'bag.summary.saving': 'Таны хэмнэлт',
    'bag.summary.total': 'Нийт',
    'bag.checkout.busy': 'Pass бэлдэж байна…',
    'bag.continue.note': 'Эхлээд төлнө, дараа нь очиж авах pass-аараа авна.\nЭнэ туршилтад зөвхөн demo төлбөр ашиглана.',
    'bag.continue': 'Demo төлбөр рүү үргэлжлүүлэх',
    'bag.footnote': 'Demo дэлгүүр · бодит худалдан авалт хийгдэхгүй',
    'bag.added': '{count} × {title} сагсанд нэмэгдлээ.',

    // Pickup pass
    'pass.empty.title': 'Таны pass энд харагдана',
    'pass.empty.body': 'Ямар нэг сайхан зүйл сонгоод очиж авах pass-аа аваарай.',
    'pass.title': 'Таны очиж авах pass',
    'pass.hero.collected': 'Сайхан төгсгөл.',
    'pass.hero.ready': 'Бяцхан сайхан зүйл, тань юм.',
    'pass.hero.collected.body': 'Сайн хүнсэнд гэр олгосонд баярлалаа.',
    'pass.hero.ready.body': 'Pass-аа болон сайхан хоолны дурлалаа авчрахад л хангалттай.',
    'pass.status.collected': 'Хүлээн авсан',
    'pass.status.ready': 'Очиж авахад бэлэн',
    'pass.qr': '{code} дугаартай очиж авах QR код',
    'pass.code': 'Эсвэл дэлгүүрт энэ кодыг хэлээрэй',
    'pass.paid': 'Demo төлбөр',
    'pass.saved': 'Сайн олдвор. {amount} хэмнэлээ.',
    'pass.stamp': 'Хүлээн авсан',
    'pass.instructions': '{note} Дэлгүүр энэ кодыг нэг удаа шалгана.',
    'pass.browse': 'Хороо руугаа буцах',
    'pass.footnote': 'Demo pass · бодит дэлгүүрт хүчингүй',

    // Pickups tab
    'pickups.title': 'Таны захиалга',
    'pickups.subtitle': 'Таны нэр бичигдсэн сайхан зүйлс.',
    'pickups.status': 'Захиалгын төлөв',
    'pickups.ready': 'Бэлэн ({count})',
    'pickups.history': 'Түүх',
    'pickups.show': 'Очиж авах pass харах',
    'pickups.receipt': 'Баримт харах',
    'pickups.empty.ready.title': 'Тэсэн ядан хүлээх зүйл',
    'pickups.empty.ready.body': 'Demo захиалга баталгаажуулмагц pass-ууд энд харагдана.',
    'pickups.empty.history.title': 'Сайн хүнс, сайхан дурсамж',
    'pickups.empty.history.body': 'Хүлээн авсан захиалга, баримтууд энд хадгалагдана.',

    // Saved tab
    'saved.title': 'Бяцхан дуртай зүйлс',
    'saved.subtitle': 'Дараагийн удаа өлсөхөд чинь.',
    'saved.note': 'Хадгалах нь захиалга биш. Үлдэгдэл өөрчлөгдөж болно.',
    'saved.empty.title': 'Сайныг нь ойрхон байлгаарай',
    'saved.empty.body': 'Олдворын зүрхэн дээр дарвал энд хүлээж байх болно.',

    // Profile
    'you.account': 'Demo хөрш',
    'you.greeting': 'Сайн байна уу, хөрш өө.',
    'you.subtitle': 'Бяцхан энэрэл их үрээ өгдөг.',
    'you.stat.orders': 'сайхан захиалга',
    'you.stat.saved': 'хэмнэсэн',
    'you.link.area': 'Та хаана байна',
    'you.link.history': 'Захиалгын түүх',
    'you.link.history.small': 'Өмнөх очилт, баримтууд',
    'you.link.saved': 'Хадгалсан олдворууд',
    'you.link.saved.small': '{count} бяцхан дуртай зүйл',
    'you.link.how': 'Monty хэрхэн ажилладаг вэ',
    'you.link.how.small': 'Сайн хүнсэнд хоёр дахь боломж',
    'you.preview.title': 'Monty-г бага зэрэг амтлах нь',
    'you.preview.body': 'Энэ бол жишээ дэлгүүр, жишээ төлбөртэй demo хаяг. Хөтөч дээр хадгалах боломжтой үед өөрчлөлт зөвхөн энэ хөтөч дотор үлдэнэ.',
    'you.workspace.merchant': 'Борлуулагчийн хэсэг',
    'you.workspace.admin': 'Удирдлагын хэсэг',
    'you.reset': 'Шинэ demo эхлүүлэх',

    /* Companions. A name is a proper noun: it is the same word in both
       languages, written in the reader's own script. Монти keeps the loaf's
       own name, Банхар is the herder's dog and Ботго is a young camel. */
    'you.pet.title': 'Таны бяцхан нөхөр',
    'you.pet.body': 'Сонгосон нөхөр тань лангуу хүртэл тантай хамт явна.',
    'you.pet.choose': 'Нөхрөө сонгох',
    'pet.loaf': 'Монти',
    'pet.loaf.trait': 'Зуухнаас дөнгөж гарсан.',
    'pet.cat': 'Мишээ',
    'pet.cat.trait': 'Очилтын хооронд нойрсоно.',
    'pet.dog': 'Банхар',
    'pet.dog.trait': 'Хаалганд хамгийн түрүүнд очно.',
    'pet.bunny': 'Хөвөн',
    'pet.bunny.trait': 'Олдвор болгон руу үсэрнэ.',
    'pet.lamb': 'Хонгор',
    'pet.lamb.trait': 'Үлдсэн хоолыг өрөвддөг.',
    'pet.camel': 'Ботго',
    'pet.camel.trait': 'Том сагсыг үүрнэ.',

    /* What a companion answers a tap with. Warm and short: this is the voice
       of a friend in the corner of the screen, not a notification. */
    'pet.tap': '{name}-г товшиж сайхан үг сонсох',
    'pet.cheer.luck': 'Өнөөдөр танд амжилт хүсье.',
    'pet.cheer.better': 'Та бодсоноосоо илүү сайн байна.',
    'pet.cheer.today': 'Өнөөдөр ямар ч байлаа гэсэн, та даван туулж байна.',
    'pet.cheer.proud': 'Танаараа бахархаж байна. Алив, урагшаа.',
    'pet.cheer.kindself': 'Өнөөдөр өөртөө эелдэг хандаарай.',
    'pet.cheer.harder': 'Та үүнээс хэцүү өдрүүдийг даван туулж байсан.',
    'pet.cheer.breath': 'Амьсгаа аваарай. Та зүгээр байна.',
    'pet.cheer.step': 'Нэг алхам, дараа нь дахиад нэг. Тэгээд л боллоо.',
    'pet.cheer.here': 'Хэрэгтэй үед чинь би энд байна.',
    'pet.cheer.showed': 'Та ирсэн. Хамгийн хэцүү нь тэр.',
    'pet.cheer.tired': 'Ядрах гэдэг бүтэлгүйтэх гэсэн үг биш.',
    'pet.cheer.slowly': 'Удаан ч бай, урагшилж л байна.',
    'pet.cheer.onewin': 'Өнөөдөрт нэг л бяцхан амжилт хангалттай.',
    'pet.cheer.rest': 'Амрах нь ч бас нэг хийсэн ажил.',
    'pet.cheer.cold': 'Улаанбаатар хүйтэн. Та тийм биш.',

    // Floating bag and toasts
    'floating.one': 'Сагсанд {count} сайхан зүйл',
    'floating.many': 'Сагсанд {count} сайхан зүйл',
    'floating.view': 'Сагс харах',
    'toast.order': 'Demo захиалга баталгаажлаа. Очиж авах pass бэлэн боллоо.',
    'toast.reset': 'Бүгд шинэчлэгдлээ. Дахин нэг тойрон харна уу.',
    'toast.pet': '{name} тантай хамт явах боллоо.',
    'toast.dismiss': 'Мэдэгдэл хаах',

    // Modals
    'modal.close': 'Цонх хаах',
    'modal.location.title': 'Та хаана байна',
    'modal.location.body': 'Monty бүх зайг эндээс хэмжинэ. Таны байршил зөвхөн энэ хөтөч дотор үлдэх бөгөөд хаашаа ч илгээгдэхгүй.',
    'modal.location.note': 'Сүхбаатарын талбайн ойролцоох жишээ байршил. Юу ч хадгалагдахгүй, илгээгдэхгүй бөгөөд дэлгүүрүүд нь жишээ дэлгүүрүүд юм.',
    'modal.location.note.live': 'Таны төхөөрөмжийн байршлыг зөвхөн энэ хөтөч дээр уншсан. Юу ч хадгалагдахгүй, илгээгдэхгүй бөгөөд дэлгүүрүүд нь жишээ дэлгүүрүүд юм.',
    'modal.filters.title': 'Танд тохирох сонголт',
    'modal.filters.body': 'Хүнсийг ингэж харуулах…',
    'modal.filters.apply': 'Олдворуудаа харах',
    'modal.switch.title': 'Энэ дэлгүүрээс шинэ сагс эхлэх үү?',
    'modal.switch.body': 'Нэг захиалга нэг дэлгүүрээс байна. Одоогийн сагсаа {shop}-ийн {count} × {title}-аар солих уу, эсвэл эхлээд одоогийн сагсаа захиалах уу?',
    'modal.switch.new': 'Шинэ сагс эхлүүлэх',
    'modal.switch.keep': 'Одоогийн сагсаа хадгалах',
    'modal.how.title': 'Сайн хүнс, сайхан төгсгөл',
    'modal.how.find.title': 'Сайхан зүйл олоорой',
    'modal.how.find.body': 'Дэлгүүрүүд өнөөдөр хийсэн хүнсээ хямд үнээр тавина. Хүссэн зүйлээ, хүссэн тоогоор сонгоно.',
    'modal.how.pay.title': 'Очихоосоо өмнө төлнө',
    'modal.how.pay.body': 'Захиалга бүр нэг дэлгүүрээс байна. Энэ туршилтад төлбөр нь demo бөгөөд мөнгө суутгахгүй.',
    'modal.how.collect.title': 'Очиж авна',
    'modal.how.collect.body': 'Очиж авах хугацаандаа лангуун дээр QR pass эсвэл нөөц кодоо үзүүлнэ.',
    'modal.how.done': 'Сайхан байна',
    'modal.reset.title': 'Шинэхэн эхлэл үү?',
    'modal.reset.body': 'Энэ нь хөтөч дотор хадгалагдсан demo захиалга, дуртай зүйлс, дэлгүүрийн өөрчлөлтийг арилгана.',
    'modal.reset.confirm': 'Demo-г шинэчлэх',
    'modal.reset.keep': 'Үргэлжлүүлэн үзэх',

    /* ---- The clock ----
       A pickup window is only useful once it is counted down, so these are
       the most-read strings in the product after a price. */
    'window.open': '{time} хүртэл',
    'window.closing': '{minutes} минутын дараа хаагдана',
    'window.closed': 'Өнөөдрийн хугацаа дууссан',
    'window.opens': '{time}-аас',
    'window.opens.soon': '{minutes} минутын дараа нээгдэнэ',
    'offer.closed': 'Өнөөдөрт оройтлоо',
    'offer.pickup.window': 'Очиж авах цаг {start}–{end}',
    'offer.warning.closed': 'Өнөөдрийн очиж авах хугацаа дууссан. Энэ зүйл маргааш дахин гарна.',
    'clock.label': 'Одоогийн цаг',
    'clock.device': 'Очиж авах цаг таны төхөөрөмжийн цагаар тооцогдоно',

    /* ---- Payment ----
       Shaped around QPay, which is how Ulaanbaatar pays. Every one of these
       survives the switch from the demo provider to the real one. */
    'pay.provider.demo': 'Demo QPay',
    'pay.banner': 'Demo төлбөр. Мөнгө шилжихгүй, банктай холбогдохгүй, картын мэдээлэл асуухгүй.',
    'pay.amount': 'Төлөх дүн',
    'pay.qr.alt': 'Төлбөрийн QR код',
    'pay.qr.note': 'Банкны аппаараа уншуулах, эсвэл доороос банкаа сонгоно уу.',
    'pay.banks': 'Банкны аппаараа төлөх',
    'pay.waiting': 'Банкны баталгаажуулалтыг хүлээж байна…',
    'pay.paid': 'Төлбөр хүлээн авлаа',
    'pay.paid.body': 'Захиалга болон очиж авах pass-ыг тань үүсгэж байна…',
    'pay.failed': 'Төлбөр гүйцэтгэгдсэнгүй',
    'pay.failed.body': 'Ямар ч мөнгө суутгаагүй. Бэлэн болмогцоо дахин эхлүүлээрэй.',
    'pay.expired': 'Энэ нэхэмжлэхийн хугацаа дууслаа',
    'pay.cancelled': 'Төлбөрийг цуцаллаа',
    'pay.cancel': 'Төлбөрийг цуцлах',
    'pay.back': 'Сагс руу буцах',
    'pay.simulate': 'Шалгагчийн удирдлага · {provider}',
    'pay.simulate.paid': 'Төлөгдсөн нэхэмжлэхийг дуурайх',
    'pay.simulate.failed': 'Татгалзсаныг дуурайх',
    'bag.payment.description': '{shop}-аас Monty-гоор очиж авах',
    'pass.paid.via': 'Төлсөн · {bank}',
    'pass.status.expired': 'Хугацаа дууссан',
    'pass.expired': 'Захиалгыг авахаас өмнө очиж авах хугацаа дууссан байна. Бодит үйлчилгээнд энд мөнгө буцаах эсвэл дахин зарлах сонголт гарч ирнэ.',
    'pickups.expired': 'Юу болсныг харах',
    'pickups.rate': 'Энэ захиалгыг үнэлэх',

    /* ---- Trust ----
       The count matters more than the score: 4.8 from nine people is a
       rumour, 4.8 from three hundred is a reputation. */
    'trust.rating.long': '{count} удаагийн авалтаас 5-аас {score}',
    'trust.count': '({count})',
    'trust.rate': 'Ямар байсан бэ?',
    'trust.rated': 'Баярлалаа — та 5-аас {value} гэж үнэллээ.',
    'trust.rate.value': '5-аас {score} гэж үнэлэх',
    'trust.rate.note': 'Таны үнэлгээ захиалгаа очиж авсны дараа л тоологдоно.',
    'trust.rescued': 'Энэ дэлгүүрээс өдийг хүртэл {count} хоол аврагдсан.',
    'toast.rated': 'Баярлалаа. Таны үнэлгээ дараагийн хөршид тусална.',
    'toast.newday': 'Шинэ өдөр. Өдөр бүрийн бараанууд лангуун дээр эргэн тавигдлаа.',

    // Sorting
    'sort.nearby': 'Ойролцоо',
    'sort.price': 'Хамгийн хямд',
    'sort.savings': 'Хамгийн их хямдрал',
    'sort.ending': 'Хамгийн эрт дуусах',

    /* ---- Location ----
       Distance units are abbreviated the way a Mongolian sign writes them:
       м and км, with a space before the unit. */
    'unit.metres': '{value} м',
    'unit.kilometres': '{value} км',
    'place.square': 'Сүхбаатарын талбай',
    'place.statedept': 'Улсын их дэлгүүр',
    'place.seoul': 'Сөүлийн гудамж',
    'place.ardkino': 'Ард кино театрын талбай',
    'place.sansar': 'Сансарын уулзвар',
    'place.zaisan': 'Зайсан',
    'place.here': 'Таны байршил',
    'radius.1': '1 км',
    'radius.3': '3 км',
    'radius.5': '5 км',
    'radius.all': 'Хаана ч байсан',
    'district.all': 'Улаанбаатар даяар',
    'district.sukhbaatar': 'Сүхбаатар дүүрэг',
    'district.chingeltei': 'Чингэлтэй дүүрэг',
    'district.bayangol': 'Баянгол дүүрэг',
    'district.bayanzurkh': 'Баянзүрх дүүрэг',
    'district.khanuul': 'Хан-Уул дүүрэг',
    'location.use': 'Миний байршлыг ашиглах',
    'location.following': 'Таны байршлыг дагаж байна',
    'location.live': 'Таныг хөдлөхөд зай шинэчлэгдэнэ. Зогсоохыг хүсвэл дахин дарна уу.',
    'location.denied': 'Таны хөтөч байршлын зөвшөөрлийг татгалзсан тул Monty Сүхбаатарын талбайн ойролцоо байна. Өөрийн байршлаа ашиглахыг хүсвэл хөтчийнхөө тохиргооноос зөвшөөрнө үү.',
    'location.timeout': 'Таны төхөөрөмж байршлыг олоход хэт удсан тул Monty Сүхбаатарын талбайн ойролцоо байна.',
    'location.unsupported': 'Энэ хөтөч дискнээс нээсэн файлаас байршил өгөхгүй тул Monty Сүхбаатарын талбайн ойролцоо байна.',
    'location.locating': 'Таныг олж байна…',
    'location.places': 'Эсвэл өөр газар зогсоорой',
    'location.radius': 'Хэр хол явах вэ?',
    'location.districts': 'Дүүрэг',
    'location.shops': 'Гэрээт {count} дэлгүүр',
    'map.label': '{place}-ын эргэн тойрны {count} дэлгүүрийн схем зураг',
    'map.caption': 'Чиглэл, зай нь бодит. Гудамжууд нь схем бөгөөд таны байршил дүрслэл юм.',
    'map.hint': 'Дэлгүүр харахын тулд тэмдэглэгээ дээр дарна уу. Та бол голын цэг.',
    'map.browse': 'Энэ дэлгүүрийн хүнсийг үзэх',
    'toast.located': 'Таныг оллоо. Зай шинэчлэгдлээ.',
    'toast.located.demo': 'Хөтчөөс байршил аваагүй тул Monty {place}-ын ойролцоо байна.',
    'toast.place': '{place} дээр зогслоо. Зай шинэчлэгдлээ.',

    // Empty state default action
    'empty.action': 'Өнөөдрийн хүнсийг үзэх',

    // ---- Merchant and operations workspaces ----
    'ops.demo': 'Demo ажлын хэсэг · бодит төлбөр байхгүй',
    'ops.back': 'Хэрэглэгчийн апп руу буцах',
    'ops.admin.title': 'Тайзны ард, бяцхан халамж.',
    'ops.admin.subtitle': 'Энэ demo дахь дэлгүүр, хүнс, очилтын тодорхой дүр зураг.',
    'ops.merchant.title': 'Таны бяцхан дэлгүүр, Monty дээр.',
    'ops.merchant.subtitle': 'Өнөөдрийн сайн хүнсээ лангуун дээрээ тавь. Бид гэр олоход нь туслая.',
    'ops.shop.picker': 'Дэлгүүр сонгох',
    'ops.nav.admin': 'Удирдлагын хэсэг',
    'ops.nav.merchant': 'Дэлгүүрийн хэсэг',
    'ops.tab.overview': 'Тойм',
    'ops.tab.shops': 'Дэлгүүрүүд',
    'ops.tab.offers': 'Саналууд',
    'ops.tab.orders': 'Захиалгууд',
    'ops.tab.people': 'Хүмүүс',
    'ops.tab.items': 'Бүтээгдэхүүн',
    'ops.tab.pickups': 'Очилт',

    'ops.stat.shops': 'Demo дэлгүүр',
    'ops.stat.offers': 'Идэвхтэй санал',
    'ops.stat.orders': 'Хийгдсэн захиалга',
    'ops.stat.collected': 'Хүлээн авсан зүйл',
    'ops.stat.counter': 'Лангуун дээрх зүйл',
    'ops.stat.awaiting': 'Хүлээгдэж буй захиалга',

    'ops.items.heading': '{shop}-ийн лангуун дээр',
    'ops.items.subtitle': 'Зураг, мэдээллээ хадгална. Дахин боломжтой болоход нь дахин ашиглаарай.',
    'ops.items.add': '+ Бүтээгдэхүүн нэмэх',
    'ops.items.manage': 'Бүтээгдэхүүн удирдах',
    'ops.offers.empty.title': 'Сайхан зүйлд зай гаргаарай.',
    'ops.offers.empty.body': 'Зураг, үнэ, очиж авах хугацаатай эхний бүтээгдэхүүнээ нэмнэ үү.',
    'ops.offer.available': '{count} боломжтой',
    'ops.offer.status.paused': 'Түр зогсоосон',
    'ops.offer.status.soldout': 'Дууссан',
    'ops.offer.status.live': 'Лангуун дээр',
    'ops.offer.edit': 'Засах',
    'ops.offer.edit.label': '{title} засах',
    'ops.offer.reuse': 'Дахин ашиглах',
    'ops.offer.reuse.label': '{title} дахин ашиглах',
    'ops.offer.pause': 'Түр зогсоох',
    'ops.offer.publish': 'Нийтлэх',

    'ops.editor.new': 'Шинэ бяцхан санал',
    'ops.editor.edit': 'Бяцхан өөрчлөлт',
    'ops.editor.reuse': 'Лангуун дээр эргүүлж тавих',
    'ops.editor.close': 'Засварлагч хаах',
    'ops.field.title': 'Бүтээгдэхүүний нэр',
    'ops.field.title.placeholder': 'жишээ нь Цөцгийн тосны круассан',
    'ops.field.description': 'Тайлбар',
    'ops.field.description.placeholder': 'Юугаараа амттай вэ?',
    'ops.field.category': 'Ангилал',
    'ops.field.original': 'Үндсэн үнэ (₮)',
    'ops.field.price': 'Monty үнэ (₮)',
    'ops.field.quantity': 'Боломжит тоо ширхэг',
    'ops.field.from': 'Очиж авах эхлэл',
    'ops.field.until': 'Очиж авах төгсгөл',
    'ops.field.photo': 'Зураг',
    'ops.field.photo.group': 'Жишээ зураг сонгох',
    'ops.field.photo.use': '{title} жишээ зургийг ашиглах',
    'ops.field.photo.note': 'Таван жишээ гэрэл зураг, дараа нь та өөрийн зургаа илгээх хүртэл зард ашиглагдах зурсан дүрсүүд.',
    'ops.field.photo.drawing': '{number} дугаар зурсан дүрсийг ашиглах',
    'ops.field.link': 'Эсвэл зургийн холбоос оруулах',
    'ops.field.link.note': 'https:// зургийн холбоос ашиглах, эсвэл дээрх жишээг үлдээнэ үү.',
    'ops.field.allergens': 'Харшил үүсгэгч',
    'ops.field.allergens.placeholder': 'жишээ нь Улаан буудай, сүү, өндөг',
    'ops.field.allergens.note': 'Харшил үүсгэгч бүрийг таслалаар тусгаарлана уу.',
    'ops.field.active': 'Энэ бүтээгдэхүүнийг хэрэглэгчдэд харуулах',
    'ops.field.save': 'Бүтээгдэхүүн хадгалах',
    'ops.field.save.changes': 'Өөрчлөлт хадгалах',
    'ops.error.photo': 'Жишээ зураг сонгох эсвэл http:// эсвэл https:// зургийн холбоос оруулна уу.',
    'ops.saved.new': 'Таны шинэ бүтээгдэхүүн хадгалагдлаа.',
    'ops.saved.edit': 'Таны бүтээгдэхүүн шинэчлэгдлээ.',
    'ops.toggled.paused': 'Бүтээгдэхүүнийг түр зогсоолоо.',
    'ops.toggled.live': 'Бүтээгдэхүүн лангуун дээр байна.',

    'ops.pickups.heading': 'Бяцхан хүлээлгэн өгөлт',
    'ops.pickups.subtitle': 'Хэрэглэгчийн pass-ыг шалгаад хүлээлгэн өгөлтийг баталгаажуулна уу.',
    'ops.pickups.manage': 'Очилт удирдах',
    'ops.pickups.panel': 'Лангуун дээр',
    'ops.pickups.panel.body': 'Хэрэглэгчээс очиж авах pass дээрх зургаан тэмдэгтийн кодыг асууна уу.',
    'ops.pickups.code': 'Очиж авах код',
    'ops.pickups.confirm': 'Очилт баталгаажуулах',
    'ops.pickups.success': '{code} захиалгыг хүлээлгэн өглөө. Баярлалаа!',
    'ops.pickups.toast': 'Очилт баталгаажлаа. Сайхан хооллоорой!',
    'ops.orders.empty.title': 'Лангуу одоохондоо чимээгүй байна.',
    'ops.orders.empty.body': 'Хэрэглэгчийн туршилтаас захиалга хийгээд эргэж ирж үзээрэй.',
    'ops.order.status.collected': 'Хүлээн авсан',
    'ops.order.status.ready': 'Хүлээгдэж байна',
    'ops.order.pickup': 'Очилт {start}–{end}',
    'ops.order.paid': 'Demo төлбөр хийгдсэн',

    'ops.overview.title': 'Өнөөдрийн demo үйл ажиллагаа',
    'ops.overview.rescued': 'Хаягдахаас аварсан зүйл',
    'ops.overview.rescued.note': 'Хүлээн авсан demo захиалгад багтсан хүнсний тоо ширхэг.',
    'ops.overview.awaiting': 'Хүлээгдэж буй захиалга',
    'ops.overview.collectedorders': 'Хүлээн авсан захиалга',
    'ops.overview.value': 'Demo захиалгын дүн',
    'ops.overview.savings': 'Хэрэглэгчийн хэмнэлт',
    'ops.overview.rate': 'Хүлээн авалтын хувь',
    'ops.overview.rate.body': '{collected}/{total} захиалгыг лангуун дээр хүлээн авсан.',
    'ops.overview.rate.none': 'Захиалга хийгдмэгц хүлээн авалтын хувь энд харагдана.',
    'ops.overview.note.title': 'Бяцхан эхлэл.',
    'ops.overview.note.1': 'Улаанбаатар даяар гэрээт {shops} дэлгүүр. Олон сайхан идэх зүйл. Очиж авах нэг энгийн арга.',
    'ops.overview.note.2': 'Та захиалга хийх, санал өөрчлөх, очилт баталгаажуулах бүрд эдгээр тоо шинэчлэгдэнэ.',
    'ops.overview.note.3': 'Demo захиалгын дүн нь загварчлагдсан. Энэ нь платформын орлого эсвэл борлуулагчид шилжүүлэх төлбөр биш.',

    'ops.shops.label': 'Demo дэлгүүрүүд',
    // Merchant: the clock, standing listings and the money
    'ops.clock': 'Одоогийн цаг {time} · {day} дэх өдөр',
    'ops.newday': 'Маргаашийг эхлүүлэх',
    'ops.tab.money': 'Мөнгө',
    'ops.stat.payout': 'Өнөөдөр нөхөгдсөн',
    'ops.field.recurring': 'Үүнийг өдөр бүр лангуун дээр эргүүлэн тавих',
    'ops.field.daily': 'Өдөрт хэдэн ширхэг',
    'ops.field.daily.note': 'Өнөө орой юу үлдсэнээс үл хамааран маргааш энэ тооноос эхэлнэ.',
    'ops.offer.daily': 'Өдөр бүр',
    'ops.offer.status.closed': 'Хугацаа дууссан',
    'ops.money.manage': 'Таны мөнгө',
    'ops.money.heading': 'Өнөөдөр кассанд юу эргэж орсон бэ',
    'ops.money.subtitle': 'Хаях байсан хүнс, тэр нь юу болж эргэн ирсэн нь.',
    'ops.money.payout': 'Авч явсан захиалгаас нөхөгдсөн',
    'ops.money.payout.note': 'Зөвхөн очиж авсан захиалга тоологдоно. Хэн ч ирээгүй захиалга бол ямар ч байсан хогийн саванд орсон хүнс.',
    'ops.money.pending': 'Төлсөн, авахыг хүлээж буй',
    'ops.money.rescued': 'Аврагдсан зүйл',
    'ops.money.wasted': 'Хэн ч ирээгүй зүйл',
    'ops.money.recurring': 'Өдөр бүрийн байнгын зар',
    'ops.money.trust.title': 'Үйлчлүүлэгчид тань юу гэж бодож байна',
    'ops.money.trust.body': '{count} хүн тан дээрээс авсан захиалгаа үнэлсэн бөгөөд {rescued} хоол хогийн саван биш энэ лангууг орхижээ.',
    'ops.money.settle': 'Энэ туршилтын төлбөр бол тоо баримт болохоос шилжүүлэг биш. Бодит үйлчилгээ таны данс руу өөрийн хуваарийн дагуу шилжүүлнэ.',
    'ops.shops.map': 'Хотын төвөөс харсан сүлжээ',
    'ops.shops.distance': 'Уншигчаас',
    'ops.offers.all.count': '{shops} дэлгүүрт нийт {count} зар.',
    'ops.offers.filter': 'Харуулах',
    'ops.offers.filter.all': 'Бүх дэлгүүр',
    'ops.shops.offers': 'Идэвхтэй санал',
    'ops.shops.awaiting': 'Хүлээгдэж буй захиалга',
    'ops.shops.completed': 'Дууссан очилт',
    'ops.offers.all': 'Бүх саналууд',
    'ops.offers.all.heading': 'Дэлгүүр бүрийн лангуу',
    'ops.orders.all': 'Бүх захиалга',
    'ops.orders.all.heading': 'Төлбөрөөс хүлээлгэн өгөлт хүртэл',
    'ops.people.title': 'Энэ туршилт дахь хүмүүс',
    'ops.people.body': 'Энэ туршилтад бүртгэлтэй хэрэглэгч байхгүй. Хэрэглэгч, дэлгүүр, удирдлагын харагдац нь Monty-н тал бүрийг үзэх боломж олгоно.',
    'ops.people.customer': 'Хэрэглэгчийн харагдац',
    'ops.people.customer.value': 'Нэг дотоод demo',
    'ops.people.shops': 'Дэлгүүрийн харагдац',
    'ops.people.shops.value': '{count} жишээ дэлгүүр',
    'ops.people.admin': 'Удирдлагын харагдац',
    'ops.people.admin.value': 'Энэ ажлын хэсэг',
    'ops.footnote': 'Энд харагдаж буй бүх дэлгүүр, бүтээгдэхүүн, захиалга нь demo жишээ. Үүрэг солих нь зөвхөн загварыг үзэх зорилготой.',

    /* Allergen names are the one piece of seeded content still written here:
       a merchant types allergens as free text, so the key is the word itself
       rather than a record id, and the list is shared across every item.

       Shop and item wording lives beside the record in catalogue.mjs and is
       merged in below, so a new item cannot be added in one language only. */
    'demo.allergen.Wheat': 'Улаан буудай',
    'demo.allergen.Milk': 'Сүү',
    'demo.allergen.Eggs': 'Өндөг',
    'demo.allergen.Sesame': 'Гүнжид',
    'demo.allergen.Soy': 'Шар буурцаг',
    'demo.allergen.Fish': 'Загас',
    'demo.allergen.Crustaceans': 'Хавч хэлбэртэн',
    'demo.allergen.Nuts': 'Самар',
    'demo.allergen.Peanuts': 'Газрын самар',
    'demo.allergen.Mustard': 'Гичий',
    'demo.allergen.Celery': 'Селдерей',
    'demo.allergen.Sulphites': 'Сульфит',
  },
};

/* Shop and item wording is written beside the record it belongs to, so there
   is exactly one place to add an item and no way to add it in one language
   only. It is folded in here because `t` is what the interface already calls
   and a second lookup path would be a second thing to get wrong. */
Object.assign(catalogues.mn, demoStrings('mn'));

// CLDR puts the tugrik symbol before the number for `mn`, but Monty's own
// convention across the product is a trailing symbol. The number itself is
// grouped by the locale, which is the part that actually varies.
const SYMBOL = '₮';

// English here means the day-first 'en-GB', not 'en-US': everywhere Monty
// operates writes 21 Sep, not Sep 21. Digit grouping is identical between the
// two, so this choice only governs date order.
const TAGS = { en: 'en-GB', mn: 'mn-MN' };

let locale = 'en';
const numberFormats = new Map();
const dateFormats = new Map();

function localeTag() { return TAGS[locale] || TAGS.en; }

// Intl data for a tag can be missing in a trimmed runtime; fall back rather
// than letting a formatter throw in the middle of a render.
function cached(store, tag, create) {
  if (!store.has(tag)) {
    let formatter;
    try { formatter = create(tag); }
    catch { formatter = create(TAGS.en); }
    store.set(tag, formatter);
  }
  return store.get(tag);
}

function numberFormat() {
  return cached(numberFormats, localeTag(), tag => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }));
}

function dateFormat() {
  return cached(dateFormats, localeTag(), tag => new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' }));
}

export function getLocale() { return locale; }

export function setLocale(next) {
  if (!SUPPORTED.includes(next)) return locale;
  locale = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  return locale;
}

/* `{name}` placeholders are filled from `values`. A placeholder with no matching
   value is left as written, never printed as "undefined". A missing value then
   shows up as an obvious gap during review instead of reading as real copy. */
function fill(text, values) {
  if (!values) return text;
  return String(text).replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole));
}

export function t(key, fallback, values) {
  return fill(catalogues[locale]?.[key] ?? catalogues.en[key] ?? fallback ?? key, values);
}

export function money(value) {
  return numberFormat().format(Number(value) || 0) + ' ' + SYMBOL;
}

// An order with a missing or unparseable timestamp still has to render. Absent
// values are rejected before Date sees them: new Date(null) is the Unix epoch,
// and quietly showing 1 Jan 1970 is worse than showing nothing at all.
export function date(value) {
  if (value === null || value === undefined || value === '') return '';
  const at = value instanceof Date ? value : new Date(value);
  return Number.isNaN(at.getTime()) ? '' : dateFormat().format(at);
}

// Exported for the test that checks the Mongolian column has no placeholder
// mismatches against the English it replaces.
export const catalogue = catalogues;
