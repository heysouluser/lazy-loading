const lazyImages = document.querySelectorAll('img[data-src], source[data-srcset]');
const loadMapBlock = document.querySelector('._load-map');
const windowHeight = document.documentElement.clientHeight; // высота экрана браузера без скроллов
const loadMoreBlock = document.querySelector('._load-more');

let lazyImagesPositions = []; // массив положений (относительно верха страницы) всех изображений

if (lazyImages.length > 0) {
   lazyImages.forEach(img => {
      // проверка на то, заполнены ли эти data атрибуты
      if (img.dataset.src || img.dataset.srcset) {
         lazyImagesPositions.push(img.getBoundingClientRect().top + scrollY);
         lazyScrollCheck(); // добавляем запуск этой функции сюда, для того чтобы она отрабатывала, если будет происходить перезагрузка страницы на этих открытых объектах. В таком случае они сразу будут прогружаться
      }
   });
}

window.addEventListener('scroll', lazyScroll);

function lazyScroll() {
   // когда все объекты пользователю будут показаны, мы перестанем запускать эту функцию, т.к. функция lazyScrollCheck удалит все элементы массива с положениями изображений и эта проверка не пройдет
   if (document.querySelectorAll('img[data-src], source[data-srcset]').length > 0) {
      lazyScrollCheck();
   }
   // если функция getMap() еще не была выполнена и карта не была загружена
   if (!loadMapBlock.classList.contains('_loaded')) {
      getMap();
   }
   if (!loadMoreBlock.classList.contains('_loading')) {
      loadMore();
   }
}

function lazyScrollCheck() {
   let imgIndex = lazyImagesPositions.findIndex(
      // если количество прокрученных пикселей больше, чем позиция, которая записана у нас в массиве минус высота страницы
      // т.е. в момент когда на нижней границе страницы окна браузера появится искомый объект, сработает это условие и в переменную imgIndex присвоится индекс внутри массива
      item => scrollY > item - windowHeight
   );
   // если ничего не будет найдено, то вернется -1
   if (imgIndex >= 0) {
      if (lazyImages[imgIndex].dataset.src) {
         lazyImages[imgIndex].src = lazyImages[imgIndex].dataset.src;
         lazyImages[imgIndex].removeAttribute('data-src');
      } else if (lazyImages[imgIndex].dataset.srcset) {
         lazyImages[imgIndex].srcset = lazyImages[imgIndex].dataset.srcset;
         lazyImages[imgIndex].removeAttribute('data-srcset');
      }
   }
   // затем очищаем ячейку с позицией данного объекта в массиве, для того чтобы он больше не участвовал в проверке в начале этой функции (lazyScrollCheck), потому что findIndex прекращает свою работу как только находит совпадение
   delete lazyImagesPositions[imgIndex];
}

function getMap() {
   const loadMapBlockPos = loadMapBlock.getBoundingClientRect().top + scrollY;
   if (scrollY > loadMapBlockPos - windowHeight) {
      const loadMapUrl = loadMapBlock.dataset.map;
      if (loadMapUrl) {
         loadMapBlock.insertAdjacentHTML(
            "beforeend",
            `<iframe src="${loadMapUrl} style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
         );
         loadMapBlock.classList.add('_loaded');
      }
   }
}

function loadMore() {
   const loadMoreBlockPos = loadMoreBlock.getBoundingClientRect().top + scrollY;
   // отрабатывать подгрузку контента мы будем при достижении скроллом конца блока (высота будет меняться каждый раз при новой подгрузке контента и соответственно нам нужна константа с обновленными значениями)
   const loadMoreBlockHeight = loadMoreBlock.offsetHeight;

   if (scrollY > (loadMoreBlockPos + loadMoreBlockHeight) - windowHeight) {
      getContent();
   }
}

// т.к. будем работать с ajax`ом, функцию делаем асинхронной
async function getContent() {
   if (!document.querySelector('.loading-icon')) {
      loadMoreBlock.insertAdjacentHTML(
         "beforeend",
         `<div class="_loading-icon"></div>` // подгружаем гифку с загрузкой, пока будет подгружаться контент
      );
   }
   // если этот класс есть, то мы не будем вызывать всю функцию, чтобы у нас не было повторной отправки на сервер (т.е. пока у нас что-то грузится, в этот момент не будет выполняться функция loadMore())
   loadMoreBlock.classList.add('_loading');

   let response = await fetch('_more.html', {
      method: "GET",
   });
   if (response.ok) {
      let result = await response.text();
      loadMoreBlock.insertAdjacentHTML("beforeend", result);
      loadMoreBlock.classList.remove('_loading');
      if (document.querySelector('._loading-icon')) {
         document.querySelector('._loading-icon').remove();
      }
   } else {
      alert("Ошибка");
   }
}