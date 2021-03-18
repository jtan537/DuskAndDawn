using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class DawnElixir : InventoryItemBase
{

    public override void OnUse()
    {
        print("used dawn elixir");
        GameObject.FindObjectOfType<SwitchCharacter>().dawn_elixir_drunk = true;
    }

    public override void OnPickup(Collider collider)
    {
    }

    public override string Name
    {
        get
        {
            return "DawnElixir";
        }
    }
    public override string Description
    {
        get
        {
            return "A potion that holds special powers, allowing you to communicate with whoever drinks the same potion";
        }
    }
}