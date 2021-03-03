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

    void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        IInventoryItem item = e.Item;

        if (item.Name == "MoonFlower")
        {
            item.OnUse();
            inventory.RemoveItem(item);
        }

        if (quest.numRequiredFlowers == 0)
        {
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
            gem.SetActive(true);
            DialogUI.Instance.dialogueRunner.StartDialogue(NPC.ActiveNPC.YarnStartNode);
            quest.numRequiredFlowers = -1;
        }
    }
}
