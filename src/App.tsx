import { useEffect, useState } from "react";
import "./App.css";
import * as v from "valibot";

//Types
type ResultsType = {
	results: {
		name: string;
		url: string;
	}[];
};

type Captured = {
	name: string;
	sprites: {
		front_default: string;
	};
	types: {
		type: {
			name: string;
		};
	}[];
}[];

type SetCaptured = React.Dispatch<React.SetStateAction<Captured>>;

type Pokemon = {
	name: string;
	sprites: {
		front_default: string;
	};
	types: {
		type: {
			name: string;
		};
	}[];
};
// Schemas
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

function App() {
	//UseStates
	const [captured, setCaptured] = useState<
		v.InferOutput<typeof PokemonSchema>[]
	>(() => {
		const saved = localStorage.getItem("capturedPokemons");
		return saved ? JSON.parse(saved) : [];
	});
	const [pokemons, setPokemons] = useState<
		v.InferOutput<typeof PokemonSchema>[]
	>([]);
	const [filteredNames, setFilteredNames] = useState("");
	const [filteredTypes, setFilteredTypes] = useState("");
	// Constants
	const displayedPokemons = pokemons.filter(
		(pokemon) =>
			pokemon.name.includes(filteredNames) &&
			(filteredTypes === "" ||
				pokemon.types.some((t) => t.type.name === filteredTypes)),
	);
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
			localStorage.setItem("capturedPokemons", JSON.stringify(captured));
			const response = await fetch(
				"https://pokeapi.co/api/v2/pokemon?limit=20&offset=0",
			);

			const data = await response.json();

			const resultsList = v.parse(ResultsSchema, data);
			const pokemonURLs = getPokemons(resultsList);

			const pokemons = await Promise.all(
				pokemonURLs.map(async (url) => {
					const response = await fetch(url);
					const pokemon = await response.json();
					return pokemon;
				}),
			);

			const parsedPokemons = pokemons.map((pokemon) => {
				const parsedPokemon = v.parse(PokemonSchema, pokemon);
				return parsedPokemon;
			});
			setPokemons(parsedPokemons);
		}
		run();
	}, [captured]);

	return (
		<>
			<input
				value={filteredNames}
				onChange={(fp) => setFilteredNames(fp.target.value)}
			></input>
			<select
				defaultValue=""
				onChange={(fp) => setFilteredTypes(fp.target.value)}
			>
				<option value="">All types</option>
				{types.map((type, index) => {
					const typeId = `type-${index}`;
					return <option key={typeId}>{type}</option>;
				})}
			</select>
			<div className="main-container">
				<div className="pokemon-grid">
					{displayedPokemons.map((pokemon, index) => {
						const pokeId = `Poke-${index}`;
						return (
							<div key={pokeId} className="card">
								<img src={pokemon.sprites.front_default} alt={pokemon.name} />
								<p>{pokemon.name}</p>
								<ul>
									{pokemon.types.map((type, index) => {
										const pokeTypeId = `PokeType-${index}`;
										return <li key={pokeTypeId}>{type.type.name}</li>;
									})}
								</ul>
								<button
									type="button"
									onClick={() => {
										capturePokemon(setCaptured, captured, pokemon);
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
						const captId = `Poke-${index}`;
						return (
							<div key={captId} className="card">
								<img
									src={captPokemon.sprites.front_default}
									alt={captPokemon.name}
								/>
								<p>{captPokemon.name}</p>
								<ul>
									{captPokemon.types.map((type, index) => {
										const typeId = `CaptPokeType-${index}`;
										return <li key={typeId}>{type.type.name}</li>;
									})}
								</ul>
								<button
									type="button"
									onClick={() => {
										setCaptured(
											captured.filter((captured) => captured !== captPokemon),
										);
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

function capturePokemon(
	setCaptured: SetCaptured,
	captured: Captured,
	pokemon: Pokemon,
) {
	if (!captured.some((p) => p.name === pokemon.name)) {
		setCaptured([...captured, pokemon]);
	}
}
export default App;
