import { useEffect, useState } from "react";
import "./App.css";
import * as v from "valibot";

type ResultsType = {
  results: {
    name: string;
    url: string;
  }[];
};

const PokemonResultsSchema = v.object({
  name: v.string(),
  url: v.string(),
});
const ResultsSchema = v.object({
  results: v.array(PokemonResultsSchema),
});
const PokemonSpritesSchema = v.object({
  front_default: v.string(),
});
const TypeNameSchema = v.object({
  name: v.string(),
});
const TypesSchema = v.object({
  type: TypeNameSchema,
});
const PokemonSchema = v.object({
  name: v.string(),
  sprites: PokemonSpritesSchema,
  types: v.array(TypesSchema),
});
type Pokemon = v.InferOutput<typeof PokemonSchema>;

function App() {
  const [captured, setCaptured] = useState<Pokemon[]>(() => {
    const saved = localStorage.getItem("capturedPokemons");
    if (!saved) {
      return [];
    }
    const pokemons = v.parse(v.array(PokemonSchema), JSON.parse(saved));
    return pokemons;
  });
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [filteredNames, setFilteredNames] = useState("");
  const [filteredTypes, setFilteredTypes] = useState("");

  const displayedPokemons = pokemons
    .filter((pokemon) => {
      if (!filteredNames) {
        return true;
      }
      return pokemon.name.includes(filteredNames);
    })
    .filter((pokemon) => {
      if (!filteredTypes) {
        return true;
      }
      return pokemon.types.some((t) => t.type.name === filteredTypes);
    });
  const types = (() => {
    const allTypes: string[] = [];
    pokemons.forEach((pokemon) => {
      pokemon.types.forEach((typesArray) => {
        allTypes.push(typesArray.type.name);
      });
    });
    return [...new Set(allTypes)];
  })();

  useEffect(() => {
    async function run() {
      localStorage.setItem("captured", JSON.stringify(captured));
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=20&offset=0",
      );

      const data = await response.json();

      const resultsList = v.parse(ResultsSchema, data);
      const pokemonURLs = getPokemons(resultsList);

      const pokemons = await Promise.all(
        pokemonURLs.map(async (url) => {
          const response = await fetch(url);
          const data = await response.json();
          const pokemon = v.parse(PokemonSchema, data);
          return pokemon;
        }),
      );
      setPokemons(pokemons);
    }
    run();
  }, [captured]);

  return (
    <>
      <input
        value={filteredNames}
        onChange={(event) => {
          setFilteredNames(event.target.value);
        }}
      ></input>
      <select
        defaultValue=""
        onChange={(event) => {
          setFilteredTypes(event.target.value);
        }}
      >
        <option value="">All types</option>
        {types.map((type, index) => {
          const id = `type-${index}`;
          return <option key={id}>{type}</option>;
        })}
      </select>
      <div className="main-container">
        <div className="pokemon-grid">
          {displayedPokemons.map((pokemon, index) => {
            const id = `poke-${index}`;
            return (
              <div key={id} className="card">
                <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                <p>{pokemon.name}</p>
                <ul>
                  {pokemon.types.map((type, index) => {
                    const id = `PokeType-${index}`;
                    return <li key={id}>{type.type.name}</li>;
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    if (!captured.some((p) => p.name === pokemon.name)) {
                      setCaptured([...captured, pokemon]);
                    }
                    console.log(pokemon);
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
        <div className="pokemon-grid">
          {captured.map((captPokemon, index) => {
            const id = `Poke-${index}`;
            return (
              <div key={id} className="card">
                <img
                  src={captPokemon.sprites.front_default}
                  alt={captPokemon.name}
                />
                <p>{captPokemon.name}</p>
                <ul>
                  {captPokemon.types.map((type, index) => {
                    const id = `CaptPokeType-${index}`;
                    return <li key={id}>{type.type.name}</li>;
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setCaptured((prevCaptured) => {
                      return prevCaptured.filter(
                        (captured) => captured !== captPokemon,
                      );
                    });
                  }}
                >
                  -
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function getPokemons(resultsList: ResultsType) {
  const pokemonURLs = resultsList.results.map((pokemon) => {
    return pokemon.url;
  });
  return pokemonURLs;
}

export default App;
