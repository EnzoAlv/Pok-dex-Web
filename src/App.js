import React, { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [pokemon, setPokemon] = useState({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [pokemonList, setPokemonList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [description, setDescription] = useState('');

  const LIMIT = 20;

  function loadAPI(pokemonName) {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Pokémon não encontrado');
        return res.json();
      })
      .then((json) => {
        setPokemon(json);
        setError(null);
        openModal(json);
      })
      .catch((err) => {
        setError(err.message);
        setPokemon({});
      });
  }

  function loadPokemonList() {
    if (loading) return;
    setLoading(true);

    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${LIMIT}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const promises = data.results.map((pokemon) =>
          fetch(pokemon.url).then((res) => res.json())
        );
        return Promise.all(promises);
      })
      .then((results) => {
        const sortedResults = [...pokemonList, ...results].sort((a, b) => a.id - b.id);
        setPokemonList(sortedResults);
        setOffset((prevOffset) => prevOffset + LIMIT);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  function openModal(pokemon) {
    setSelectedPokemon(pokemon);
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)
      .then((res) => res.json())
      .then((data) => {
        const flavorText = data.flavor_text_entries.find(
          (entry) => entry.language.name === 'en'
        );
        setDescription(flavorText ? flavorText.flavor_text : 'No description available.');
      })
      .catch((err) => console.error(err));
  }

  function closeModal() {
    setSelectedPokemon(null);
    setDescription('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (search.trim() !== '') {
      loadAPI(search);
    }
  }

  useEffect(() => {
    loadPokemonList();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          Pokédex
        </h1>
      </header>
      <div className="container">
        {/* Formulário de busca */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite o nome do Pokémon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        {/* Mensagem de erro */}
        {error && <p className="error">{error}</p>}

        {/* Lista de Pokémon */}
        <div className="pokemon-list">
          {pokemonList.map((poke) => (
            <div
              key={poke.id}
              className="pokemon-card"
              onClick={() => openModal(poke)}
            >
              <img src={poke.sprites.other['official-artwork'].front_default} alt={poke.name} />
              <div>Nome: {poke.name.toUpperCase()}</div>
              <div>Número: {poke.id}</div>
              <div>Peso: {poke.weight / 10}kg</div>
              <div>Altura: {poke.height / 10}m</div>
            </div>
          ))}
        </div>

        {/* Botão "Carregar mais" */}
        <div className="load-more">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <button onClick={loadPokemonList}>Carregar mais</button>
          )}
        </div>

        {/* Modal */}
        {selectedPokemon && (
          <div className="modal">
            <div className="modal-content">
              <button className="close-button" onClick={closeModal}>
                Fechar
              </button>
              <img src={selectedPokemon.sprites.other['official-artwork'].front_default} alt={selectedPokemon.name} />
              <h2>{selectedPokemon.name.toUpperCase()}</h2>
              <p>Número: {selectedPokemon.id}</p>
              <p>Peso: {selectedPokemon.weight / 10}kg</p>
              <p>Altura: {selectedPokemon.height / 10}m</p>
              <p>Tipos: {selectedPokemon.types.map((type) => type.type.name).join(', ')}</p>
              <p>Descrição: {description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;