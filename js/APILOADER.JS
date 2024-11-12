$(document).ready(function () {
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const apiUrl = 'http://dragonball-api.com/api';
    let characters = [];
    let planets = [];
    let currentSection = 'characters';//inicializara la pagina con personajes.
    const itemsPerPage = 12;
    let currentPage = 1;
    let currentTransformationIndex = 0;

    $('.planets-filters').hide();

    $('#isDestroyedYes').on('change', function () {
        if ($(this).is(':checked')) {
            $('#isDestroyedNo').prop('checked', false);
        }
    });

    $('#isDestroyedNo').on('change', function () {
        if ($(this).is(':checked')) {
            $('#isDestroyedYes').prop('checked', false);
        }
    });

    async function loadFilterOptions() {
        const races = [...new Set(characters.map(char => char.race).filter(Boolean))];
        const affiliations = [...new Set(characters.map(char => char.affiliation).filter(Boolean))];
        const genders = [...new Set(characters.map(char => char.gender).filter(Boolean))];
        populateFilterOptions(races, affiliations, genders);
    }

    // Función para llenar los selects de filtro
    function populateFilterOptions(races, affiliations, genders) {
        const raceOptions = races.map(race => `<option value="${race}">${race}</option>`).join('');
        $('#raceFilter').html(`<option value="">Todas</option>${raceOptions}`);
        const affiliationOptions = affiliations.map(aff => `<option value="${aff}">${aff}</option>`).join('');
        $('#affiliationFilter').html(`<option value="">Todas</option>${affiliationOptions}`);
        const genderOptions = genders.map(gender => `<option value="${gender}">${gender}</option>`).join('');
        $('#genderFilter').html(`<option value="">Todos</option>${genderOptions}`);
    }
    //Armamos la url en funcion de los filtros seleccionados.
    function buildFilterUrl() {
        const selectedRace = $('#raceFilter').val();
        const selectedAffiliation = $('#affiliationFilter').val();
        const selectedGender = $('#genderFilter').val();
        const isDestroyedYes = $('#isDestroyedYes').is(':checked');
        const isDestroyedNo = $('#isDestroyedNo').is(':checked');
        const searchName = $('#search').val();
        let url = `${corsProxy}${apiUrl}/${currentSection}?`;
        if (selectedRace) url += `race=${encodeURIComponent(selectedRace)}&`;
        if (selectedAffiliation) url += `affiliation=${encodeURIComponent(selectedAffiliation)}&`;
        if (selectedGender) url += `gender=${encodeURIComponent(selectedGender)}&`;
        if (searchName) url += `name=${encodeURIComponent(searchName)}&`;
        // Agregar el parámetro isDestroyed basado en los checkboxes
        if (currentSection === 'planets') {
            if (isDestroyedYes) {
                url += `isDestroyed=true&`;
            } else if (isDestroyedNo) {
                url += `isDestroyed=false&`;
            }
        }
        // Eliminar el último '&' en la URL si existe
        return url.slice(-1) === '&' ? url.slice(0, -1) : url;
    }


    async function loadCharacters(page = 1, charactersArray = []) {
        const url = `${buildFilterUrl()}&page=${page}&limit=10`;
        console.log(`Cargando personajes de la página ${page}...`);
        try {
            const response = await $.ajax({
                url: url,
                method: 'GET'
            });
            console.log("la solicitud es:", buildFilterUrl`?page=${page}&limit=10`);
            console.log(`Respuesta de personajes página ${page}:`, response);
            let newCharacters = [];
            //verifica que la respuesta a la solicitud sea un array.
            if (Array.isArray(response)) {
                newCharacters = response;
            } else if (response.items && Array.isArray(response.items)) {
                newCharacters = response.items;
            } else {
                console.error('Formato de respuesta inesperado para personajes');
                return;
            }
            //Concatena los nuevos personajes obtenidos con los personajes que ya se han cargado.
            charactersArray = charactersArray.concat(newCharacters);
            if (newCharacters.length === 10) {
                //por consulta se trae hasta un maximo de 10 resultados, 
                // por lo que si el resultado de la cantidad de personajes obtenidos en cada iteracion es 10
                // significa que hay mas resultados por lo que se agregara una pagina mas y se volvera a llamar a la function.
                await loadCharacters(page + 1, charactersArray);
            } else {
                characters = charactersArray;
            }
        } catch (error) {
            console.error('Error al cargar personajes:', error);
        }
    }

    async function loadPlanets(page = 1, planetsArray = []) {
        const url = `${buildFilterUrl()}&page=${page}&limit=10`;
        console.log(`Cargando planetas de la página ${page}...`);
        try {
            const response = await $.ajax({
                url: url,
                method: 'GET'
            });
            console.log(`Respuesta de planetas página ${page}:`, response);

            let newPlanets = [];
            if (Array.isArray(response)) {
                newPlanets = response;
            } else if (response.items && Array.isArray(response.items)) {
                newPlanets = response.items;
            } else {
                console.error('Formato de respuesta inesperado para planetas');
                return;
            }
            planetsArray = planetsArray.concat(newPlanets);
            if (newPlanets.length === 10) {
                await loadPlanets(page + 1, planetsArray);
            } else {
                planets = planetsArray;
            }
        } catch (error) {
            console.error('Error al cargar planetas:', error);
        }
    }

    function resetAndLoadData() {
        characters = [];
        planets = [];
        currentPage = 1;
        if (currentSection === 'characters') {
            //.then asegura que primero se terminar de ejecutar loadCharacters antes de que se ejecute filterAndDisplayResults
            //esto para evitar errores de que se intente filtrar y crear las cards antes de que se carguen todos los personajes/plantes.
            loadCharacters().then(filterAndDisplayResults);
        } else {
            loadPlanets().then(filterAndDisplayResults);
        }
    }
    function filterAndDisplayResults() {
        const filteredResults = (currentSection === 'characters' ? characters : planets)
            .filter(item => {
                const selectedRace = $('#raceFilter').val();
                const selectedAffiliation = $('#affiliationFilter').val();
                const selectedGender = $('#genderFilter').val();
                const Name = $('#search').val();
                const isDestroyedYes = $('#isDestroyedYes').is(':checked');
                const isDestroyedNo = $('#isDestroyedNo').is(':checked');
                return (
                    (!selectedRace || item.race === selectedRace) &&
                    (!selectedAffiliation || item.affiliation === selectedAffiliation) &&
                    (!selectedGender || item.gender === selectedGender) &&
                    (!Name || item.Name === Name) &&
                    (currentSection === 'planets'
                        ? (isDestroyedYes ? item.isDestroyed === true : true) &&
                        (isDestroyedNo ? item.isDestroyed === false : true)
                        : true)
                );
            });
        displayResults(filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        renderPagination(filteredResults.length);
    }

    function displayResults(items) {
        let html = '';
        items.forEach(item => {
            if (currentSection === 'characters') {
                html += createCharacterCard(item);
                console.log("mostrando personajes");
            } else {
                html += createPlanetCard(item);
                console.log("mostrando planetas");
            }
        });
        if (currentSection === 'characters') {
            $('.characters-filters').fadeIn();
            $('.planets-filters').fadeOut();
        } else {
            $('.characters-filters').fadeOut();
            $('.planets-filters').fadeIn();
        }
        $('#results').html(html || '<p>No se encontraron resultados para mostrar.</p>');
    }


    function createCharacterCard(character) {
        return `
            <div class="card character-card" data-id="${character.id}">
                <img src="${character.image || 'placeholder.jpg'}" class="card-img-top" alt="${character.name}" onerror="this.src='placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${character.name || 'Nombre desconocido'}</h5>
                    <p class="card-text"><i class="fas fa-dna"></i> Raza: ${character.race || 'Desconocida'}</p>
                </div>
            </div>
        `;
    }
    
    function createPlanetCard(planet) {
        return `
            <div class="card planet-card" data-id="${planet.id}">
                <img src="${planet.image || 'placeholder.jpg'}" class="card-img-top" alt="${planet.name}" onerror="this.src='placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${planet.name || 'Nombre desconocido'}</h5>
                </div>
            </div>
        `;
    }
    
    function renderPagination(totalItems) {
        // Calcula cuántas páginas serán necesarias, redondeando hacia arriba.
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let paginationHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            //le asignamos el data-page 
            //   asi controlamos a que pagina debe ir cuando se cliquea en el.
            paginationHtml += `<button class="page-btn" data-page="${i}">${i}</button>`;
        }
        $('#pagination').html(paginationHtml);
        $('.page-btn').on('click', function () {
            console.log("ir a la pagina ")
            currentPage = parseInt($(this).data('page'));
            filterAndDisplayResults();
        });
    }
    $('.navbar-nav .nav-link').on('click', function (e) {
        e.preventDefault();
        currentSection = $(this).data('section');
        console.log(currentSection);
        resetAndLoadData();
    });

    $('#filter-form').on('submit', function (e) {
        e.preventDefault();
        resetAndLoadData();
    });

    $(document).on('click', '.character-card, .planet-card', function () {
        const id = $(this).data('id');
        //devuelve el id del planeta o personaje seleccionado.
        const item = currentSection === 'characters'
            ? characters.find(char => char.id === id)
            : planets.find(planet => planet.id === id);
        if (item) {
            showModal(item);
        }
    });
    //cierra el modal al hacer click fuera de el
    $(window).on('click', function (event) {
        if (event.target == $('#modal')[0]) {
            $('body').removeClass('no-scroll');
            $('#modal').hide();
        }
    });

    function showModal(item) {
        const itemType = currentSection === 'characters' ? 'characters' : 'planets';
        const itemId = item.id;
        $.ajax({
            url: `${corsProxy}${apiUrl}/${itemType}/${itemId}`,
            method: 'GET',
            success: function (data) {
                currentTransformationIndex = 0; // Reinicia el índice de transformación
                let modalContent = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <button id="transformButton">Mostrar transformación</button>
                    <h2>${data.name || 'Nombre desconocido'}</h2>
                    <img src="${data.image || 'placeholder.jpg'}" alt="${data.name}" onerror="this.src='placeholder.jpg'">
                    ${itemType === 'characters' ? `
                        <p><i class="fas fa-dna"></i> <strong>Raza:</strong> ${data.race || 'Desconocida'}</p>
                        <p><i class="fas fa-venus-mars"></i> <strong>Género:</strong> ${data.gender || 'Desconocido'}</p>
                        <p><i class="fas fa-globe"></i> <strong>Planeta de origen:</strong> ${data.originPlanet?.name || 'Desconocido'}</p>
                        <p><i class="fas fa-users"></i> <strong>Afiliación:</strong> ${data.affiliation || 'Desconocido'}</p>
                        <p><i class="fas fa-bolt"></i> <strong>Poder:</strong> ${data.ki || 'Desconocido'}</p>
                        <p><i class="fas fa-bolt"></i> <strong>Poder máximo:</strong> ${data.maxKi || 'Desconocido'}</p>
                        <p><i class="fas fa-scroll"></i> <b>${data.description || 'Desconocido'}</b></p>
                    ` : `
                        <p><i class="fas fa-globe"></i> <strong>Estado del planeta:</strong> ${data.isDestroyed ? 'Destruido' : 'Activo'}</p>
                        <p><i class="fas fa-scroll"></i> <b>${data.description || 'Desconocido'}</b></p>
                    `}
                </div>
            `;
                $('#modal').html(modalContent).show();
                $('body').addClass('no-scroll');

                $('.close').on('click', function () {
                    $('body').removeClass('no-scroll');
                    $('#modal').hide();
                });

                if (itemType === 'characters' && data.transformations && data.transformations.length > 0) {
                    $('#transformButton').on('click', function () {
                        transform(data);
                    });
                }
            },
            error: function (error) {
                console.error('Error al cargar detalles:', error);
                $('#modal').html('<p>Error al cargar los detalles del personaje/planeta.</p>').show();
            }
        });
    }

    function transform(character) {
        if (character.transformations && currentTransformationIndex < character.transformations.length) {
            const transformation = character.transformations[currentTransformationIndex];
            currentTransformationIndex++;
            $('body').append('<div class="transformation-effect"><img class="ki-image" src="./img/ssjki.png" alt="Ki Energy"></div>');
            const audio = new Audio('./transform.mp3');
            audio.play();
            setTimeout(function () {
                $('.transformation-effect').remove();
                const transformationContent = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <button id="transformButton">Mostrar transformación</button>
                    <h2>${character.name} (${transformation.name})</h2>
                    <img id="characterImage" src="${transformation.image || 'placeholder.jpg'}" alt="${character.name}">
                    <p><i class="fas fa-dna"></i> <strong>Raza:</strong> ${character.race || 'Desconocida'}</p>
                    <p><i class="fas fa-venus-mars"></i> <strong>Género:</strong> ${character.gender || 'Desconocido'}</p>
                    <p><i class="fas fa-globe"></i> <strong>Planeta de origen:</strong> ${character.originPlanet?.name || 'Desconocido'}</p>
                    <p><i class="fas fa-users"></i> <strong>Afiliación:</strong> ${character.affiliation || 'Desconocido'}</p>
                    <p><i class="fas fa-bolt"></i> <strong>Poder Actual:</strong> <span id="characterKi" class="moving-ki">${transformation.ki || 'Desconocido'}</span></p>
                    <p><i class="fas fa-bolt"></i> <strong>Poder máximo:</strong> ${character.maxKi || 'Desconocido'}</p>
                    <p><i class="fas fa-scroll"></i> <b>${character.description || 'Desconocido'}</b></p>
                </div>
            `;
                $('#modal').html(transformationContent);

                $('.close').on('click', function () {
                    $('body').removeClass('no-scroll');
                    $('#modal').hide();
                });
                if (currentTransformationIndex < character.transformations.length) {
                    $('#transformButton').on('click', function () {
                        transform(character);
                    });
                } else {
                    $('#transformButton').remove(); // Quita el botón si no hay más transformaciones
                }
            }, 2000);
        } else {
            alert("No hay más transformaciones disponibles.");
        }
    }

    //espera que las promesas que les pases por 
    //parametro terminen antes de ejecutar las funciones que se le pida. 
    Promise.all([loadCharacters(), loadPlanets()]).then(() => {
        loadFilterOptions();
        filterAndDisplayResults();
    });
});
