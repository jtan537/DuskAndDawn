using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class TutorialQuest : MonoBehaviour
{

    VariableStorageBehaviour _varStorage;
    public string GemDialogueNode { get { return gemDialogueNode; } }
    public string ElixirDialogueNode { get { return elixirDialogueNode; } }
    [SerializeField]
    Inventory inventory;
    [SerializeField]
    GameObject gem;

    bool playedGreeting = false;

    NPC _npc;
    [SerializeField] string gemDialogueNode = "Start",  elixirDialogueNode = "Start";

    bool _triggered_next_dialogue = false, _triggered_dusk_gem_dialogue = false;
    private void Start()
    {
        gem.SetActive(false);
        _npc = gameObject.GetComponent<NPC>();
        inventory.ItemUsed += Inventory_ItemUsed;
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    // Update is called once per frame
    void Update()
    {
        
        if (gameObject.tag == "Dawn")
        {
            bool spawnedDawnGem = _varStorage.GetValue("$give_dawn_tutorial_gem").AsBool;
            if (spawnedDawnGem == true)
            {
                gem.SetActive(true);
            }

            // If gem is triggered, give Dawn the Elixir and trigger next dialogue
            if (spawnedDawnGem == true && gem.GetComponentInChildren<Gem>().pickedUp && !_triggered_next_dialogue)
            {
                _npc.activatedQuest = true;
                IInventoryItem item = gameObject.GetComponent<IInventoryItem>();
                inventory.AddItem(item);
                GameObject.Find("Dawn").GetComponent<NPCInteract>().Interact(gemDialogueNode);
                _triggered_next_dialogue = true;
            }
        } else if (gameObject.tag == "Dusk")
        {
            bool finished_initial_dialogue = _varStorage.GetValue("$give_dusk_elixir").AsBool;

            // If initial dialogue from Dusk is finished, give Dusk the Elixir and trigger next dialogue
            if (finished_initial_dialogue && !_triggered_next_dialogue)
            {
                _npc.activatedQuest = true;
                IInventoryItem item = gameObject.GetComponent<IInventoryItem>();
                inventory.AddItem(item);
                _triggered_next_dialogue = true;
            }

            bool spawnedDuskGem = _varStorage.GetValue("$give_dusk_tutorial_gem").AsBool;
            if (spawnedDuskGem == true)
            {
                gem.SetActive(true);
            }
            // If gem is triggered, and Dusk picked it up, trigger the final dialogue
            if (spawnedDuskGem == true && gem.GetComponentInChildren<Gem>().pickedUp && !_triggered_dusk_gem_dialogue)
            {
                GameObject.Find("Dusk").GetComponent<NPCInteract>().Interact(gemDialogueNode);
                _triggered_dusk_gem_dialogue = true;
            }

            
            // if transition to dawn as dusk, play initial greeting.
            if (SwitchCharacter.switchedToDawn && !playedGreeting)
            {
                GameObject.Find("Dawn").GetComponent<NPCInteract>().Interact("Tutorial.Greeting");
                playedGreeting = true;
                SwitchCharacter.switchedToDawn = false;
            }
        }
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        IInventoryItem item = e.Item;
        if (gameObject.tag == "Dawn")
        {
            Debug.Log("Dawn Tutorial Quest Elixir");

            if (item.Name == "DawnElixir")
            {
                item.OnUse();
                GameObject.Find("Dawn").GetComponent<NPCInteract>().Interact(elixirDialogueNode);
                inventory.RemoveItem(item);
            }
        } else if (gameObject.tag == "Dusk")
        {
            Debug.Log("Dusk Tutorial Quest Elixir");

            if (item.Name == "DuskElixir")
            {
                item.OnUse();
                GameObject.Find("Dusk").GetComponent<NPCInteract>().Interact(elixirDialogueNode);
                inventory.RemoveItem(item);
            }
        }
    }
}
