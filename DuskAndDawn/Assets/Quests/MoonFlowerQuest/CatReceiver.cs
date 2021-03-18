using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class CatReceiver : MonoBehaviour
{
    public GameObject gem;

    CatQuest quest;

    public Inventory inventory;

    public GameObject InteractTriggerUI;
    public GameObject textObj;

    public GameObject DuskItemDetails;

    void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        
        IInventoryItem item = e.Item;

        if (NPC.ActiveNPC.name == "Cat" && item.Name == "MoonFlower")
        {
            Debug.Log("Cat quest");
            item.OnUse();
            inventory.RemoveItem(item);

            Debug.Log("Here");

            if (quest.numRequiredFlowers == 0)
            {
                Debug.Log("1");
                textObj.GetComponent<TextMeshProUGUI>().SetText("");
                InteractTriggerUI.SetActive(false);
                gem.SetActive(true);
                DuskItemDetails.SetActive(false);
                GameObject.Find("Dusk").GetComponent<NPCInteract>().Interact();
                quest.numRequiredFlowers = -1;
            }
        }

        
    }
}
