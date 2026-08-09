[← Back to guide index](../azeroth-usage.md)

# Testing Controllers That Use Azeroth

Use standard Rails request specs or controller specs with RSpec. Since Azeroth generates conventional Rails actions, they can be exercised like any other controller action:

```ruby
RSpec.describe PokemonsController, type: :request do
  let(:master) { create(:pokemon_master) }

  describe 'POST /pokemons' do
    it 'creates a pokemon' do
      post "/pokemon_masters/#{master.id}/pokemons.json",
           params: { pokemon: { name: 'Bulbasaur' } }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['name']).to eq('Bulbasaur')
    end
  end

  describe 'GET /pokemons' do
    it 'returns all pokemons' do
      get "/pokemon_masters/#{master.id}/pokemons.json"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
    end
  end
end
```
