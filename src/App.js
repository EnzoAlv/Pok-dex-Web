import React, { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [pokemon, setPokemon] = useState({}); // Pokémon buscado
  const [search, setSearch] = useState(''); // Nome do Pokémon a buscar
  const [error, setError] = useState(null); // Mensagem de erro
  const [pokemonList, setPokemonList] = useState([]); // Lista de Pokémon
  const [offset, setOffset] = useState(0); // Offset para carregar Pokémon em lotes
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [selectedPokemon, setSelectedPokemon] = useState(null); // Pokémon selecionado para o modal
  const [description, setDescription] = useState(''); // Descrição do Pokémon
  const [suggestions, setSuggestions] = useState([]); // Sugestões para a barra de pesquisa

  const LIMIT = 20; // Número de Pokémon por lote

  // Função para buscar um Pokémon pelo nome
  function loadAPI(pokemonName) {
    let url = `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`;
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Pokémon não encontrado');
        }
        return res.json();
      })
      .then(json => {
        setPokemon(json); // Atualiza o Pokémon buscado
        setError(null); // Limpa erros anteriores
        openModal(json); // Abre o modal com o Pokémon buscado
      })
      .catch(err => {
        setError(err.message); // Define a mensagem de erro
        setPokemon({}); // Limpa o Pokémon buscado
      });
  }

  // Função para carregar Pokémon em lotes
  function loadPokemonList() {
    if (loading) return; // Evita múltiplas requisições simultâneas
    setLoading(true); // Ativa o estado de carregamento

    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${LIMIT}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const promises = data.results.map((pokemon) =>
          fetch(pokemon.url).then((res) => res.json())
        );
        return Promise.all(promises); // Busca os detalhes de cada Pokémon
      })
      .then((results) => {
        const sortedResults = [...pokemonList, ...results].sort((a, b) => a.id - b.id); // Ordena por ID
        setPokemonList(sortedResults); // Atualiza a lista de Pokémon
        setOffset((prevOffset) => prevOffset + LIMIT); // Atualiza o offset
        setLoading(false); // Desativa o estado de carregamento
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // Desativa o estado de carregamento em caso de erro
      });
  }

  // Função para abrir o modal com informações detalhadas do Pokémon
  function openModal(pokemon) {
    setSelectedPokemon(pokemon); // Define o Pokémon selecionado
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)
      .then(res => res.json())
      .then(data => {
        const flavorText = data.flavor_text_entries.find(
          (entry) => entry.language.name === 'en'
        );
        setDescription(flavorText ? flavorText.flavor_text : 'No description available.');
      })
      .catch(err => console.error(err));
  }

  // Função para fechar o modal
  function closeModal() {
    setSelectedPokemon(null); // Limpa o Pokémon selecionado
    setDescription(''); // Limpa a descrição
  }

  // Função para lidar com o envio do formulário
  function handleSubmit(e) {
    e.preventDefault(); // Evita o recarregamento da página
    if (search.trim() !== '') {
      loadAPI(search); // Busca o Pokémon pelo nome
    }
  }

  // Função para lidar com sugestões na barra de pesquisa
  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);

    if (value.trim() === '') {
      setSuggestions([]); // Limpa as sugestões se o campo estiver vazio
      return;
    }

    // Filtra os Pokémon que começam com as letras digitadas
    const filteredSuggestions = pokemonList.filter((poke) =>
      poke.name.toLowerCase().startsWith(value.toLowerCase())
    );
    setSuggestions(filteredSuggestions.slice(0, 5)); // Mostra no máximo 5 sugestões
  }

  // Carrega o primeiro lote de Pokémon ao carregar a página
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
            onChange={handleSearchChange}
          />
          <button type="submit">Buscar</button>
        </form>

        {/* Sugestões */}
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                onClick={() => {
                  setSearch(suggestion.name);
                  loadAPI(suggestion.name);
                  setSuggestions([]); // Limpa as sugestões após o clique
                }}
              >
                <img
                  src={suggestion.sprites.other['official-artwork'].front_default}
                  alt={suggestion.name}
                  className="suggestion-sprite"
                />
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}

        {/* Mensagem de erro */}
        {error && <p className="error">{error}</p>}

        {/* Lista de Pokémon */}
        <div className="pokemon-list">
          {pokemonList.map((poke) => (
            <div
              key={poke.id}
              className="pokemon-card"
              onClick={() => openModal(poke)} // Adiciona o evento de clique
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