using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class TreeReceiver : MonoBehaviour
{
    public Animator ani;
    public GameObject gem;

    TreeQuest quest;

    public Inventory inventory;

    public GameObject InteractTriggerUI;
    public GameObject textObj;

    void Start()
    {
        ani.SetBool("received", false);
        quest = GameObject.FindObjectOfType<TreeQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
    	IInventoryItem item = e.Item;

        if (item.Name == "Sun")
        {
            item.OnUse();
            inventory.RemoveItem(item);
        }
        if (quest.numRequiredSuns == 0)
        {
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
            ani.SetBool("received", true);
            gem.SetActive(true);
            DialogUI.Instance.dialogueRunner.StartDialogue(NPC.ActiveNPC.YarnStartNode);
            quest.numRequiredSuns = -1;
        }
    }
}
